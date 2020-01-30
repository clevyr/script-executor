let key = 0;
let counter = 1;
let current;
let files = [];
let tab;
let domain;

const ls = {
  files: document.getElementById('file-list'),
  name: document.getElementById('file-name'),
  execute: document.getElementById('execute-button'),
  add: document.getElementById('add-button'),
  remove: document.getElementById('remove-button'),
  content: document.getElementById('file-content'),
  trigger: document.getElementById('execution-trigger'),
};

function make(type) {
  return document.createElement(type);
}

function saveFiles() {
  const params = {};
  params[domain] = { files: files };

  chrome.storage.sync.set(params, e => {
    if (e) console.log(e);
  });
}

function fileChanged(e) {
  current = null;
  const model = files.filter(v => v.key == e.target.value)[0];
  ls.name.value = model.name;
  ls.content.value = model.content || '';
  ls.trigger.value = model.trigger || 'None';
  current = model;
  ls.content.focus();
  saveFiles();
}

function triggerChanged() {
  current.trigger = ls.trigger.value;

  saveFiles();
}

function addFileToBox(file) {
  const option = make('option');
  option.innerText = file.name;
  file.key = key++;
  option.value = file.key;
  files.push(file);
  ls.files.appendChild(option);
  ls.files.value = file.key;
  fileChanged({ target: option });
}

function filesLoaded(result) {
  if (!result || !result[domain])
    return;

  const files = result[domain].files || [];

  while (ls.files.firstChild) {
    ls.files.removeChild(ls.files.firstChild);
  }

  for (const file of files) {
    addFileToBox(file);
  }
}

function addClick() {
  addFileToBox({ name: `New Item ${counter++}` });
  ls.name.focus();
  ls.name.select();

  saveFiles();
}

function removeClick() {
  if (!current)
    return;

  let index = ls.files.selectedIndex;

  ls.files.remove(index);
  files = files.filter(v => v.key != current.key);

  if (ls.files.length > 0) {
    if (index >= ls.files.length) {
      index = ls.files.length - 1;
    }

    const option = ls.files.childNodes[index];
    ls.files.selectedIndex = index;
    fileChanged({ target: option });
  } else {
    ls.name.value = '';
  }

  saveFiles();
}

function executeClick() {
  if (!current)
    return;

  chrome.tabs.executeScript(tab.id, { code: ls.content.value });
}

function contentChanged(e) {
  if (!current)
    return;

  current.content = ls.content.value;

  saveFiles();
}

function nameUpdated(e) {
  if (!current)
    return;

  current.name = e.target.value;
  ls.files.options[ls.files.selectedIndex].text = current.name;

  saveFiles();
}

function initialize() {
  ls.add.onclick = addClick;
  ls.remove.onclick = removeClick;
  ls.execute.onclick = executeClick;
  ls.files.onclick = fileChanged;
  ls.name.onchange = nameUpdated;
  ls.content.onchange = contentChanged;
  ls.trigger.onchange = triggerChanged;

  chrome.tabs.query({ active: true, currentWindow: true }, v => {
    tab = v[0];
    domain = new URL(tab.url).hostname;
    chrome.storage.sync.get([domain], filesLoaded);
  });
}

initialize();
