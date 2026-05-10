import type { AddonEvent } from '../types/types';

declare global {
  function buildCreateDraftReplyResponse(
    event: AddonEvent
  ): GoogleAppsScript.Card_Service.ComposeActionResponse;
  function buildHomePage(event: AddonEvent): GoogleAppsScript.Card_Service.Card;
  function buildGmailContextualCard(event: AddonEvent): GoogleAppsScript.Card_Service.Card;
  function buildThreadSummaryCard(event: AddonEvent): GoogleAppsScript.Card_Service.Card;
}

export {};
