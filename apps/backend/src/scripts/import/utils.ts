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

export function toFloat(frenchNumber: string) {
  return parseFloat(frenchNumber.replace(/,/g, '.'));
}
