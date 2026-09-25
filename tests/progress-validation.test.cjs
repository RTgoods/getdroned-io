const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')

const output = ts.transpileModule(fs.readFileSync('src/lib/progress-validation.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const exportsObject = {}
new Function('exports', output)(exportsObject)
const { isValidStatInput, MAX_KILLS, MAX_SQUAD_LOST, MAX_MONEY, MAX_TIME_ALIVE, MAX_BELT_SLOTS } = exportsObject

test('accepts a plausible sector-complete payload', () => {
  assert.equal(isValidStatInput(12, 2, 4500, 340, ['drone', 'med']), true)
})

test('accepts a fresh sector with all-zero stats and an empty belt', () => {
  assert.equal(isValidStatInput(0, 0, 0, 0, []), true)
})

test('rejects fabricated absurd stats', () => {
  assert.equal(isValidStatInput(MAX_KILLS + 1, 0, 0, 0, []), false)
  assert.equal(isValidStatInput(0, MAX_SQUAD_LOST + 1, 0, 0, []), false)
  assert.equal(isValidStatInput(0, 0, MAX_MONEY + 1, 0, []), false)
  assert.equal(isValidStatInput(0, 0, 0, MAX_TIME_ALIVE + 1, []), false)
  assert.equal(isValidStatInput(Infinity, 0, 0, 0, []), false)
  assert.equal(isValidStatInput(-1, 0, 0, 0, []), false)
  assert.equal(isValidStatInput(1.5, 0, 0, 0, []), false)
})

test('rejects a belt over capacity or with unknown/injected item ids', () => {
  assert.equal(isValidStatInput(0, 0, 0, 0, new Array(MAX_BELT_SLOTS + 1).fill('med')), false)
  assert.equal(isValidStatInput(0, 0, 0, 0, ['not-a-real-tool']), false)
  assert.equal(isValidStatInput(0, 0, 0, 0, ['<script>']), false)
})

test('the hardcoded god-mode account can still save a belt containing god', () => {
  assert.equal(isValidStatInput(0, 0, 0, 0, ['god']), true)
})

test('rejects non-array or wrong-typed belt entries', () => {
  assert.equal(isValidStatInput(0, 0, 0, 0, 'med'), false)
  assert.equal(isValidStatInput(0, 0, 0, 0, [1, 2]), false)
  assert.equal(isValidStatInput(0, 0, 0, 0, undefined), false)
})
