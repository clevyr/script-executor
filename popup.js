var ext = chrome || browser;
var state = {
  activeHost: null,
  activeTab: null,
  activeScript: null,
  scripts: {}
};

var els = {
  textarea: document.querySelector('#codemirror'),
  scriptsList: document.querySelector('.scripts-list'),
  content: document.querySelector('.content'),
  contentPlaceholder: document.querySelector('.content-placeholder'),
  contentNameInput: document.querySelector('.content-header-title'),
  contentHostnameInput: document.querySelector('.content-footer-hostname'),
  contentModeSelect: document.querySelector('.content-footer-mode'),
  deleteButton: document.querySelector('.action-delete'),
  executeButton: document.querySelector('.action-execute'),
  createButton: document.querySelector('.action-create')
};

var editor = CodeMirror.fromTextArea(els.textarea, {
  lineNumbers: true,
  tabSize: 2,
  theme: 'material'
});

// Scripts

function addScript(id, script) {
  state.scripts[id] = script;

  var el = createElement('div', {
    innerHTML: script.name,
    class: 'scripts-item',
    'data-id': script.id
  });

  el.addEventListener('click', function() {
    selectScript(script.id);
  });

  els.scriptsList.appendChild(el);
  saveScripts();
}

function updateScript(id, script) {
  state.scripts[id] = script;
  document.querySelector('[data-id="' + id + '"]').innerHTML = script.name;

  saveScripts();
}

function removeScript(id) {
  document.querySelector('[data-id="' + id + '"]').remove();
  delete state.scripts[id];
  selectScript();

  saveScripts();
}

function saveScripts() {
  ext.storage.sync.set({ scripts: state.scripts });
}

function loadScripts() {
  state.scripts = {};
  els.scriptsList.innerHTML = '';

  ext.storage.sync.get('scripts', function(data) {
    if (data && data.scripts) {
      Object.values(data.scripts).forEach(function(script) {
        addScript(script.id, script);
      });
    }
  });
}

function selectScript(id) {
  state.activeScript = id;

  var oldActive = document.querySelector('.scripts-item.active');
  if (oldActive) oldActive.classList.remove('active');

  if (state.activeScript) {
    els.contentNameInput.value = state.scripts[state.activeScript].name;
    els.contentHostnameInput.value = state.scripts[state.activeScript].hostname;
    els.contentModeSelect.value = state.scripts[state.activeScript].mode;
    editor.setValue(state.scripts[state.activeScript].content);

    els.contentPlaceholder.classList.add('hide');
    els.content.classList.remove('hide');
    document.querySelector('[data-id="' + id + '"]').classList.add('active');
    editor.refresh();
  } else {
    els.contentPlaceholder.classList.remove('hide');
    els.content.classList.add('hide');
  }
}

// Event Handlers

function onCreate() {
  var script = {
    id: Date.now() + '',
    name: 'My new script',
    content: 'console.log(\'Hello World\');',
    hostname: '*',
    mode: 'none'
  };
  addScript(script.id, script);
  selectScript(script.id);
}

function onDelete() {
  var answer = confirm('Are you sure you want to delete?');
  if (!answer) return;

  removeScript(state.activeScript);
}

function onExecute() {
  if (!state.activeScript) return;

  ext.tabs.executeScript(state.activeTab.id, { code: state.scripts[state.activeScript].content });
}

function onNameChange(event) {
  if (!state.activeScript) return;

  var script = state.scripts[state.activeScript];
  script.name = event.target.value;

  updateScript(script.id, script);
}

function onContentChange(event) {
  if (!state.activeScript) return;

  var script = state.scripts[state.activeScript];
  script.content = event.getValue();

  updateScript(script.id, script);
}

function onHostnameChange(event) {
  if (!state.activeScript) return;

  var script = state.scripts[state.activeScript];
  script.hostname = event.target.value;

  updateScript(script.id, script);
}

function onModeChange(event) {
  if (!state.activeScript) return;

  var script = state.scripts[state.activeScript];
  script.mode = event.target.value;

  updateScript(script.id, script);
}

// Utility

function createElement(type, attributes) {
  var el = document.createElement(type);
  for (var attr in attributes) {
    if (attr === 'innerHTML') continue;

    el.setAttribute(attr, attributes[attr]);
  }

  if (attributes.innerHTML) el.innerHTML = attributes.innerHTML;

  return el;
}

(function init() {
  els.createButton.addEventListener('click', onCreate);
  els.deleteButton.addEventListener('click', onDelete);
  els.executeButton.addEventListener('click', onExecute);
  els.contentNameInput.addEventListener('input', onNameChange);
  els.contentHostnameInput.addEventListener('input', onHostnameChange);
  els.contentModeSelect.addEventListener('input', onModeChange);
  editor.on('change', onContentChange);

  chrome.tabs.query({ active: true, currentWindow: true }, function(v) {
    state.activeTab = v[0];
    state.activeHost = new URL(state.activeTab.url).host;
    loadScripts();
  });
})();
