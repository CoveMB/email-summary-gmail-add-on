import { buildHomeCard, buildPlaceholderGmailCard } from './Cards';

export const buildHomePage = (_event: unknown): GoogleAppsScript.Card_Service.Card =>
  buildHomeCard();

export const buildGmailContextualCard = (_event: unknown): GoogleAppsScript.Card_Service.Card =>
  buildPlaceholderGmailCard();

Object.assign(globalThis, {
  buildGmailContextualCard,
  buildHomePage,
});
