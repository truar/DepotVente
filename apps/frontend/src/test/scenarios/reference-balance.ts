// The balance of the reference bourse (« Bilan — scénarios »), every line
// worked out by hand. The bourse typed through the screens and the variants
// built in the base both check against it.
export const referenceBalance: Record<string, string> = {
  // Durand, Martin, Bon, Sport Pro.
  'Nombre de fiches': '4',
  'Dont pré-dépôts': '1',
  "Nombre d'articles en dépôt": '9',
  // 150 + 180 + 30 + 500.
  'Montant du dépôt': '860,00 €',
  'Périmètre des caisses de vente': '0 vente(s) exclue(s)',
  "Nombre d'acheteurs": '3',
  // 520 ÷ 3, 5 ÷ 3.
  'Panier moyen (€)': '173,33 €',
  'Panier moyen (articles)': '1,667',
  "Nombre d'articles vendus": '5',
  '% des articles en dépôt': '55,56 %',
  // 140 + 150 + 230.
  'Montant total des ventes': '520,00 €',
  '% de la valeur du dépôt': '60,47 %',
  // Durand paid at the deposit, Martin's deducted from his cheque.
  'Cotisations payées': '4,00 €',
  'Dont cotisations soldées au retour': '0,00 €',
  'Cotisations non payées': '0,00 €',
  // 10 % of 140 and 180, 15 % of 200.
  'Droits CMR': '62,00 €',
  'Achats CMR': '0,00 €',
  'Recette bourse théorique': '66,00 €',
  'Total paiements': '520,00 €',
  'Total cartes': '150,00 €',
  // As counted: 140 at till 5000, 30 at till 6000.
  'Total espèces': '170,00 €',
  'Total chèques': '200,00 €',
  'Total différé': '0,00 €',
  'Montant total décaissé': '456,00 €',
  'Règlements pros': '170,00 €',
  // Durand 126, Martin 162 − 2.
  'Règlements particuliers': '286,00 €',
  'Cotisations encaissées': '2,00 €',
  'Chèques particuliers non faits': '0,00 €',
  // 520 + 2 − 456.
  'Recette bourse': '66,00 €',
  'Différence recette théorique et réelle': '0,00 €',
  'Différence de caisses': '0,00 €',
  'Solde différence': '0,00 €',
}
