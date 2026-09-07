// Sélection des articles de la planche de codes-barres, sans accès à la base.

export function groupByCategory<T extends { category: string }>(articles: T[]) {
  const groups = new Map<string, T[]>();
  for (const article of articles) {
    const group = groups.get(article.category);
    if (group) group.push(article);
    else groups.set(article.category, [article]);
  }
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b, 'fr')));
}

// Tire `count` articles en prenant au plus un article par fiche et en tournant
// sur les catégories : la plus fournie d'abord, puis la suivante, ... et on
// recommence un tour tant qu'il reste des catégories avec des articles d'une
// fiche pas encore servie. Les articles arrivent triés par fiche puis par
// index, le tirage est donc déterministe.
export function sampleAcrossSellersAndCategories<T extends { category: string; depositIndex: number }>(
  articles: T[],
  count: number
) {
  const byCategory = [...groupByCategory(articles).entries()]
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([, candidates]) => candidates);
  const usedDeposits = new Set<number>();
  const sample: T[] = [];

  let progressed = true;
  while (sample.length < count && progressed) {
    progressed = false;
    for (const candidates of byCategory) {
      if (sample.length >= count) break;
      const picked = candidates.find((article) => !usedDeposits.has(article.depositIndex));
      if (!picked) continue;
      usedDeposits.add(picked.depositIndex);
      sample.push(picked);
      progressed = true;
    }
  }
  return sample;
}
