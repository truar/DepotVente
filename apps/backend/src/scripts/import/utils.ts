// Les exports sont ceux de la bourse 2025 : l'année et les codes article sont
// rebasculés sur SOURCE_YEAR → TARGET_YEAR. Les dates gardent leur valeur
// d'origine.
export const SOURCE_YEAR = 2025;
export const TARGET_YEAR = 2026;

export function shiftYearInText(value: string): string {
  return value.split(String(SOURCE_YEAR)).join(String(TARGET_YEAR));
}

export function parseToUTC(dateString: string): Date | undefined {
  if (!dateString || dateString.trim() === '') {
    return undefined;
  }

  try {
    // Parse MM/D/YYYY HH:MM format
    const [datePart, timePart] = dateString.split(' ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Create date in local timezone, then convert to UTC
    // Return the date (JavaScript Date objects are already in UTC internally)
    return new Date(parseInt('20' + year), month - 1, day, hours, minutes);
  } catch (error) {
    console.warn(`⚠️  Failed to parse date: ${dateString}`);
    return undefined;
  }
}

// Les montants arrivent formatés à la française : "2 782,50 €", avec une
// espace fine insécable comme séparateur de milliers. On ne garde que les
// caractères numériques avant de parser, sinon parseFloat s'arrête au
// séparateur et renvoie 2.
export function toFloat(frenchNumber: string) {
  const normalized = (frenchNumber ?? '')
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}
