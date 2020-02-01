var ext = chrome || browser;

function executeScripts(tabId, hostname) {
  chrome.storage.sync.get('scripts', function(data) {
    if (!data || !data.scripts) return;

    Object.values(data.scripts)
      .filter(function(script) {
        // TODO Hostname filter
        return script.mode === 'pageload';
      })
      .forEach(function(script) {
        chrome.tabs.executeScript(tabId, { code: script.content });
      });
  });
}

function updateContextMenus(hostname) {
  debounce(function() {
    _updateContextMenus(hostname);
  }, 1000);
}

function _updateContextMenus(hostname) {
  ext.contextMenus.removeAll();

  chrome.storage.sync.get('scripts', function(data) {
    if (!data || !data.scripts) return;

    Object.values(data.scripts)
      .filter(function(script) {
        // TODO Hostname filter
        return script.mode === 'context';
      })
      .forEach(function(script) {
        ext.contextMenus.create({
          id: script.id,
          title: script.name,
          contexts: ['all']
        });
      });
  });
}

ext.webNavigation.onCompleted.addListener(function(details) {
  var hostname = new URL(details.url).host;

  // Execute page load scripts
  executeScripts(details.tabId, hostname);

  // Load context scripts
  updateContextMenus(hostname);
});

ext.tabs.onHighlighted.addListener(function(details) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(v) {
    var tab = v[0];
    var hostname = new URL(tab.url).host;

    updateContextMenus(hostname);
  });
});

ext.storage.onChanged.addListener(function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(v) {
    var tab = v[0];
    var hostname = new URL(tab.url).host;

    updateContextMenus(hostname);
  });
});

ext.contextMenus.onClicked.addListener(function(info, tab) {
  chrome.storage.sync.get('scripts', function(data) {
    if (!data || !data.scripts || !data.scripts[info.menuItemId]) return;

    var script = data.scripts[info.menuItemId];
    chrome.tabs.executeScript(tab.id, { code: script.content });
  });
});

var timerId;
function debounce(func, delay) {
  clearTimeout(timerId)
  timerId = setTimeout(func, delay)
}
