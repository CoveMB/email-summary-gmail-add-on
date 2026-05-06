import type { AddonEvent } from './types';

declare global {
  function buildHomePage(event: AddonEvent): GoogleAppsScript.Card_Service.Card;
  function buildGmailContextualCard(event: AddonEvent): GoogleAppsScript.Card_Service.Card;
}

export {};
