chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId !== undefined) chrome.sidePanel?.open({ windowId: tab.windowId });
});
