import { CONFIG } from '../../config/Config';
import type { SummaryLogDetailsByEventName, SummaryLogEventName } from './SummaryLogTypes';

const buildLogSafeDetails = (details: object): object => {
  if (CONFIG.DEBUG_UNSAFE_RAW || !('unsafeRaw' in details)) {
    return details;
  }

  const { unsafeRaw: _unsafeRaw, ...safeDetails } = details as object & {
    unsafeRaw?: string;
  };

  return {
    ...safeDetails,
    unsafeRaw: '***',
  };
};

export const writeSummaryLogEvent = <EventName extends SummaryLogEventName>(
  eventName: EventName,
  details: SummaryLogDetailsByEventName[EventName]
): void => {
  console.warn(
    JSON.stringify({
      app: CONFIG.APP_NAME,
      eventName,
      details: buildLogSafeDetails(details),
    })
  );
};
