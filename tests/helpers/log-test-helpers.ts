import { expect } from 'vitest';

export const expectSerializedValueToExclude = (
  serializedValue: string,
  privateValues: readonly string[]
): void => {
  privateValues.forEach((privateValue) => {
    expect(serializedValue).not.toContain(privateValue);
  });
};

export const expectLogEvent = (
  warningSpy: Readonly<{ mock: Readonly<{ calls: ReadonlyArray<readonly unknown[]> }> }>,
  eventName: string
): void => {
  const logEventNames = warningSpy.mock.calls.map((warningCall) => {
    const warningPayload = warningCall[0];

    if (typeof warningPayload !== 'string') {
      throw new Error('Expected warning log payload.');
    }

    const parsedWarningPayload = JSON.parse(warningPayload) as { eventName?: unknown };

    return parsedWarningPayload.eventName;
  });

  expect(logEventNames).toContain(eventName);
};

export const expectGeminiGenerateContentUrl = (url: string | undefined): void => {
  expect(url).toContain('https://generativelanguage.googleapis.com/v1beta/models/');
  expect(url).toContain(':generateContent');
};

export const readFirstWarnLogPayload = (
  warningCalls: ReadonlyArray<readonly unknown[]>
): unknown => {
  const firstWarning = warningCalls[0]?.[0];

  if (typeof firstWarning !== 'string') {
    throw new Error('Expected warning log payload.');
  }

  return JSON.parse(firstWarning) as unknown;
};
