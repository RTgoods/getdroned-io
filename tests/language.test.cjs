const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {translate, catalog} = require('../public/get-droned/assets/js/language.js');

test('Ukrainian translations retain counters, weapon models and unknown strings', () => {
  assert.equal(translate('SECTOR 3'), 'СЕКТОР 3');
  assert.equal(translate('ENEMY WAVE 2 OF 2'), 'ВОРОЖА ХВИЛЯ 2 ІЗ 2');
  assert.equal(translate('CAPTURE ENEMY HQ (1/2)'), 'ЗАХОПІТЬ ВОРОЖІ ШТАБИ (1/2)');
  assert.equal(translate('FRAG ×5'), 'ГРАНАТА ×5');
  assert.equal(translate('12/72'), '12/72');
  assert.equal(translate('VECTOR-9'), 'VECTOR-9');
  assert.equal(translate('REFINERIES DOWN'), 'НАФТОЗАВОДІВ ЗНИЩЕНО');
  assert.equal(translate('unknown'), 'unknown');
  assert.ok(Object.keys(catalog).length > 400);
});

function gameWindow(saved = 'en') {
  const listeners = {}, nodes = [], calls = [];
  const parent = {};
  const body = {nodeType: 1};
  const document = {body, documentElement: {}, createTreeWalker() {
    let index = 0; return {nextNode() {return nodes[index++] || null;}};
  }};
  class Context {
    fillText(...args) {calls.push(args);}
    strokeText(...args) {calls.push(args);}
    measureText(text) {return {width: String(text).length};}
  }
  let mutation;
  const window = {document, parent, location: {origin:'https://game.example'},
    localStorage: {getItem() {return saved;}}, CanvasRenderingContext2D: Context,
    addEventListener(name, handler) {listeners[name] = handler;}};
  vm.runInNewContext(fs.readFileSync('public/get-droned/assets/js/language.js','utf8'), {
    window, MutationObserver: class {constructor(callback) {mutation = callback;} observe() {} disconnect() {}}
  });
  return {window, nodes, calls, context: new Context(),
    text(value) {const node = {nodeType:3,nodeValue:value,parentElement:{closest(){return null;}}};nodes.push(node);mutation([{type:'characterData',target:node}]);return node;},
    update(node, value) {node.nodeValue = value;mutation([{type:'characterData',target:node}]);},
    message(language, origin = window.location.origin, source = parent) {listeners.message({origin,source,data:{type:'gd:language',language}});}
  };
}

test('live switch translates and restores DOM text without losing updated game values', () => {
  const game = gameWindow();
  const text = game.text('SECTOR 2');
  game.message('uk');assert.equal(text.nodeValue, 'СЕКТОР 2');
  game.update(text, 'SECTOR 3');assert.equal(text.nodeValue, 'СЕКТОР 3');
  game.message('en');assert.equal(text.nodeValue, 'SECTOR 3');
  game.message('uk');game.message('en');assert.equal(text.nodeValue, 'SECTOR 3');
});

test('saved language applies at boot to drawing and measurements; untrusted messages ignored', () => {
  const game = gameWindow('uk');
  assert.equal(game.window.document.documentElement.lang, 'uk');
  game.context.fillText('FIRE',10,20,30);
  assert.deepEqual(game.calls[0], ['ВОГОНЬ',10,20,30]);
  assert.equal(game.context.measureText('FIRE').width, 'ВОГОНЬ'.length);
  game.message('en','https://evil.example');
  assert.equal(game.window.document.documentElement.lang, 'uk');
  game.message('en',undefined,{});
  assert.equal(game.window.document.documentElement.lang, 'uk');
  game.message('en');game.context.fillText('FIRE',10,20);
  assert.equal(game.calls[1][0],'FIRE');
});
