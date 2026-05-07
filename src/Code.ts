import {
  buildHomeCard,
  buildPlaceholderGmailCard,
  buildThreadMetadataDisplayCard,
  buildThreadMetadataErrorCard,
} from './Cards';
import { getCurrentThreadData } from './GmailReader';
import type { AddonEvent } from './types';

const fallbackThreadMetadataErrorMessage = 'Thread metadata could not be read.';

const getSafeErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : fallbackThreadMetadataErrorMessage;

export const buildHomePage = (_event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  buildHomeCard();

export const buildGmailContextualCard = (_event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  buildPlaceholderGmailCard();

export const buildThreadMetadataCard = (event: AddonEvent): GoogleAppsScript.Card_Service.Card => {
  try {
    return buildThreadMetadataDisplayCard(getCurrentThreadData(event));
  } catch (error: unknown) {
    return buildThreadMetadataErrorCard(getSafeErrorMessage(error));
  }
};

Object.assign(globalThis, {
  buildGmailContextualCard,
  buildHomePage,
  buildThreadMetadataCard,
});
