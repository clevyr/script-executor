function executeScripts(tabId, url, trigger) {
  const domain = new URL(url).hostname;
  chrome.storage.sync.get([domain], function(data) {
    if (!data[domain] || !data[domain].files || !data[domain].files.length) return;
    for (const file of data[domain].files) {
      if (file.trigger == trigger) {
        chrome.tabs.executeScript(tabId, { code: file.content });
      }
    }
  });
}

chrome.webNavigation.onCompleted.addListener(function(details) {
  executeScripts(details.tabId, details.url, 'OnLoadComplete');
});
