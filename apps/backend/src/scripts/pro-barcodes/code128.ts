import zlib from 'node:zlib';

// Encodeur Code 128 (jeu B) + rendu PNG, sans dépendance externe.
//
// Le jeu B couvre l'ASCII 32→127, donc tous les codes article de la bourse
// (« 2026 2A »), espace comprise. Les étiquettes Dymo utilisent Code128Auto
// (voir apps/frontend/src/hooks/useDymo.ts), qui se lit indifféremment en A, B
// ou C : une planche de test encodée en B se scanne avec le même lecteur.

// Les 107 motifs du Code 128. Chaque motif décrit six largeurs d'éléments qui
// alternent barre/espace en commençant par une barre, pour un total de 11
// modules. Le motif d'arrêt (index 106) en a sept, pour 13 modules.
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
];

const START_B = 104;
const STOP = 106;

// Garde-fou sur la table : un chiffre faux passerait inaperçu à l'œil mais
// rendrait la planche illisible au scanner.
for (const [index, pattern] of PATTERNS.entries()) {
  const width = [...pattern].reduce((sum, digit) => sum + Number(digit), 0);
  const expected = index === STOP ? 13 : 11;
  if (width !== expected) {
    throw new Error(`Motif Code 128 ${index} invalide : ${width} modules au lieu de ${expected}`);
  }
}

// Zone de silence : 10 modules blancs de chaque côté, sans quoi le lecteur ne
// trouve pas le début du code.
const QUIET_ZONE = 10;

/**
 * Encode `value` en Code 128 B et renvoie un module par entrée : true = barre.
 */
export function encodeCode128B(value: string): boolean[] {
  const values: number[] = [];
  for (const char of value) {
    const point = char.codePointAt(0)!;
    if (point < 32 || point > 126) {
      throw new Error(`Caractère « ${char} » hors du jeu Code 128 B (code ${point})`);
    }
    values.push(point - 32);
  }

  // Somme de contrôle : valeur de départ + position (1-based) × valeur, mod 103.
  const checksum =
    values.reduce((sum, symbol, index) => sum + (index + 1) * symbol, START_B) % 103;

  const symbols = [START_B, ...values, checksum, STOP];

  const modules: boolean[] = new Array(QUIET_ZONE).fill(false);
  for (const symbol of symbols) {
    let bar = true;
    for (const digit of PATTERNS[symbol]) {
      for (let i = 0; i < Number(digit); i++) modules.push(bar);
      bar = !bar;
    }
  }
  modules.push(...new Array(QUIET_ZONE).fill(false));
  return modules;
}

// ── PNG ─────────────────────────────────────────────────────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

/**
 * Rend les modules en PNG niveaux de gris. `moduleWidth` est la largeur d'un
 * module en pixels : plus il est grand, plus l'impression reste nette une fois
 * l'image redimensionnée par le navigateur ou par Word.
 */
export function renderBarcodePng(
  modules: boolean[],
  options: { moduleWidth?: number; height?: number } = {}
): Buffer {
  const moduleWidth = options.moduleWidth ?? 4;
  const height = options.height ?? 140;
  const width = modules.length * moduleWidth;

  // Une ligne de pixels suffit : toutes les autres sont identiques.
  const row = Buffer.alloc(width, 0xff);
  modules.forEach((bar, index) => {
    if (bar) row.fill(0x00, index * moduleWidth, (index + 1) * moduleWidth);
  });

  // Chaque scanline PNG est précédée de son octet de filtre (0 = aucun).
  const raw = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width + 1)] = 0;
    row.copy(raw, y * (width + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profondeur : 8 bits
  ihdr[9] = 0; // type couleur : niveaux de gris
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filtrage
  ihdr[12] = 0; // entrelacement

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Code article → `data:` URI PNG, directement injectable dans un `<img>`. */
export function barcodeDataUri(value: string, options?: { moduleWidth?: number; height?: number }) {
  const png = renderBarcodePng(encodeCode128B(value), options);
  return `data:image/png;base64,${png.toString('base64')}`;
}
