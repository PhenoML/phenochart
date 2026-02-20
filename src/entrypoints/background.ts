export default defineBackground(() => {
  // Open side panel on icon click
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: Error) => console.error('sidePanel error:', error));
});
