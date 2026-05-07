export const parseDateTimeOrMinimum = (dateTime: string): number => {
  const parsedDateTime = Date.parse(dateTime);

  return Number.isNaN(parsedDateTime) ? Number.NEGATIVE_INFINITY : parsedDateTime;
};
