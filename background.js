var ext = chrome || browser;

function executeScripts(tabId, hostname) {
  ext.storage.sync.get('scripts', function (data) {
    if (!data || !data.scripts) return;

    var matching = Object.values(data.scripts).filter(v => doesHostnameMatch(hostname, v.hostname));
    matching.filter(v => v.mode === 'pageload')
      .forEach(v => ext.tabs.executeScript(tabId, { code: v.content }));
    matching.filter(v => v.mode.endsWith('seconds'))
      .forEach(v => {
        var interval = +v.mode.split(' ')[0];
        ext.tabs.executeScript(tabId, { code: v.content });
        setInterval(_ => {
          console.log(`Executing script ${data.name}`);
          ext.tabs.executeScript(tabId, { code: v.content });
        }, 1000 * interval);
      });
  });
}

function updateContextMenus(hostname) {
  debounce(function () {
    _updateContextMenus(hostname);
  }, 1000);
}

function _updateContextMenus(hostname) {
  ext.contextMenus.removeAll();

  ext.storage.sync.get('scripts', function (data) {
    if (!data || !data.scripts) return;

    Object.values(data.scripts)
      .filter(function (script) {
        return script.mode === 'context' && doesHostnameMatch(hostname, script.hostname);
      })
      .forEach(function (script) {
        ext.contextMenus.create({
          id: script.id,
          title: script.name,
          contexts: ['all']
        });
      });
  });
}

ext.webNavigation.onCompleted.addListener(function (details) {
  var hostname = new URL(details.url).host;

  // Execute page load scripts
  executeScripts(details.tabId, hostname);

  // Load context scripts
  updateContextMenus(hostname);
});

ext.tabs.onHighlighted.addListener(function (details) {
  ext.tabs.query({ active: true, currentWindow: true }, function (v) {
    var tab = v[0];
    var hostname = new URL(tab.url).host;

    updateContextMenus(hostname);
  });
});

ext.storage.onChanged.addListener(function () {
  ext.tabs.query({ active: true, currentWindow: true }, function (v) {
    var tab = v[0];
    var hostname = new URL(tab.url).host;

    updateContextMenus(hostname);
  });
});

ext.contextMenus.onClicked.addListener(function (info, tab) {
  ext.storage.sync.get('scripts', function (data) {
    if (!data || !data.scripts || !data.scripts[info.menuItemId]) return;

    var script = data.scripts[info.menuItemId];
    ext.tabs.executeScript(tab.id, { code: script.content });
  });
});

var timerId;

function debounce(func, delay) {
  clearTimeout(timerId)
  timerId = setTimeout(func, delay)
}

function doesHostnameMatch(hostname, pattern) {
  return pattern.split(',')
    .some(v => !!new RegExp('^' + v.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$').exec(hostname));
}
