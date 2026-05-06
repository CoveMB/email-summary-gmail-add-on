declare global {
  function buildHomePage(event: unknown): GoogleAppsScript.Card_Service.Card;
  function buildGmailContextualCard(event: unknown): GoogleAppsScript.Card_Service.Card;
}

export {};
