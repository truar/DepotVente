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
