export const toDateInputValue = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const useUtc = /[zZ]|[+-]\d{2}:\d{2}$/.test(value);
  const year = useUtc ? parsed.getUTCFullYear() : parsed.getFullYear();
  const month = String((useUtc ? parsed.getUTCMonth() : parsed.getMonth()) + 1).padStart(2, '0');
  const day = String(useUtc ? parsed.getUTCDate() : parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatHumanDate = (value: string): string => {
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  if (!dateOnly && /[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
