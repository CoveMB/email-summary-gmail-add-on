export const parseDateTimeOrMinimum = (dateTime: string): number => {
  const parsedDateTime = Date.parse(dateTime);

  return Number.isNaN(parsedDateTime) ? Number.NEGATIVE_INFINITY : parsedDateTime;
};

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const isoDateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const isoDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d{1,3})?)?(Z|[+-]([01]\d|2[0-3]):[0-5]\d)$/;

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const isValidDateParts = (year: number, month: number, day: number): boolean => {
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
};

const hasSupportedIsoDatePart = (
  yearText: string | undefined,
  monthText: string | undefined,
  dayText: string | undefined
): boolean => {
  if (!yearText || !monthText || !dayText) {
    return false;
  }

  return isValidDateParts(Number(yearText), Number(monthText), Number(dayText));
};

const formatDateParts = (date: Date): string => {
  const monthName = monthNames[date.getUTCMonth()] ?? 'Jan';
  const day = String(date.getUTCDate());
  const year = String(date.getUTCFullYear());

  return `${monthName} ${day}, ${year}`;
};

const formatTimeParts = (date: Date): string => {
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const hour12 = hours % 12 || 12;
  const meridiem = hours >= 12 ? 'PM' : 'AM';

  return `${String(hour12)}:${minutes} ${meridiem} UTC`;
};

export const isSupportedIsoDate = (value: string): boolean => {
  const dateOnlyMatch = value.match(isoDateOnlyPattern);

  if (dateOnlyMatch) {
    return hasSupportedIsoDatePart(dateOnlyMatch[1], dateOnlyMatch[2], dateOnlyMatch[3]);
  }

  const dateTimeMatch = value.match(isoDateTimePattern);

  if (!dateTimeMatch) {
    return false;
  }

  return (
    hasSupportedIsoDatePart(dateTimeMatch[1], dateTimeMatch[2], dateTimeMatch[3]) &&
    !Number.isNaN(new Date(value).getTime())
  );
};

export const formatIsoDateForDisplay = (isoDate: string | undefined): string | undefined => {
  if (!isoDate) {
    return undefined;
  }

  const parsedDate = new Date(isoDate);

  if (!isValidDate(parsedDate)) {
    return undefined;
  }

  return isoDate.includes('T')
    ? `${formatDateParts(parsedDate)}, ${formatTimeParts(parsedDate)}`
    : formatDateParts(parsedDate);
};
