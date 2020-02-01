var ext = chrome || browser;

function executeScripts(tabId, url, trigger) {
  var activeHost = new URL(url).host;
  chrome.storage.sync.get(activeHost, function(scripts) {
    if (scripts && scripts[activeHost]) {
      Object.values(scripts[activeHost]).forEach(function(script) {
        chrome.tabs.executeScript(tabId, { code: script.content });
      });
    }
  });
}

ext.webNavigation.onCompleted.addListener(function(details) {
  executeScripts(details.tabId, details.url, 'OnLoadComplete');
});
