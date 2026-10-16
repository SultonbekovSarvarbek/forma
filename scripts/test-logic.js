/* Проверка логики без симулятора: расчёт нормы, подбор и AI-консультант.
   Запуск: npm run test:logic */
const path = require('path');
const fs = require('fs');
const Module = require('module');
const ts = require('typescript');
const assert = require('assert');

const SRC = path.join(__dirname, '..', 'src');

// Резолвим алиас "@/..." и .ts-файлы, транспилируем TypeScript на лету
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  let req = request;
  if (req.startsWith('@/')) req = path.join(SRC, req.slice(2));
  if ((req.startsWith('.') || path.isAbsolute(req)) && parent) {
    const base = path.isAbsolute(req) ? req : path.resolve(path.dirname(parent.filename), req);
    for (const ext of ['.ts', '.tsx']) if (fs.existsSync(base + ext)) return base + ext;
  }
  return origResolve.call(this, req, parent, ...rest);
};
require.extensions['.ts'] = function (module, filename) {
  const out = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(out.outputText, filename);
};

const { calcNorms, recommend, DEFAULT_PROFILE } = require(path.join(SRC, 'lib/nutrition.ts'));
const { initialState, greeting, replyLocal } = require(path.join(SRC, 'lib/consultant.ts'));
const { formatSum } = require(path.join(SRC, 'lib/format.ts'));

const YEAR = 2026;
let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓', name);
}

test('формат суммы', () => {
  assert.strictEqual(formatSum(1480000), '1 480 000 сум');
  assert.strictEqual(formatSum(950), '950 сум');
});

test('норма: 30 лет, 80 кг, 180 см, масса, 4 раза в неделю', () => {
  const n = calcNorms({ ...DEFAULT_PROFILE, birthYear: 1996, weightKg: 80, heightCm: 180, gymDaysPerWeek: 4, goal: 'mass' }, YEAR);
  assert.strictEqual(n.age, 30);
  assert.strictEqual(n.bmr, 1780);
  assert.ok(n.kcal > 2700 && n.kcal < 3100, `kcal ${n.kcal}`);
  assert.strictEqual(n.proteinTarget, 145);
  assert.strictEqual(n.proteinMin, 130);
  assert.strictEqual(n.proteinMax, 175);
});

test('подбор укладывается в бюджет', () => {
  for (const budget of [400_000, 700_000, 1_000_000, 2_000_000]) {
    for (const goal of ['mass', 'cut', 'maintain', 'strength']) {
      const r = recommend({ ...DEFAULT_PROFILE, goal, monthlyBudget: budget, mealsPerDay: 4 }, undefined, YEAR);
      assert.ok(r.total <= budget, `${goal} ${budget}: ${r.total}`);
    }
  }
});

test('мало ест и цель масса → гейнер', () => {
  const r = recommend({ ...DEFAULT_PROFILE, goal: 'mass', mealsPerDay: 2, monthlyBudget: 1_000_000 }, undefined, YEAR);
  assert.strictEqual(r.items[0].product.category, 'gainer');
});

test('непереносимость лактозы → только безлактозные товары', () => {
  const r = recommend({ ...DEFAULT_PROFILE, lactoseIntolerant: true, mealsPerDay: 3, monthlyBudget: 1_500_000 }, undefined, YEAR);
  assert.ok(r.items.length > 0);
  for (const i of r.items) assert.ok(i.product.lactoseFree, i.product.name);
});

test('сушка → изолят', () => {
  const r = recommend({ ...DEFAULT_PROFILE, goal: 'cut', mealsPerDay: 3, monthlyBudget: 1_500_000 }, undefined, YEAR);
  assert.strictEqual(r.items[0].product.id, 'on-isolate-1360');
});

test('на рационе «Масса» протеин не навязываем', () => {
  const r = recommend({ ...DEFAULT_PROFILE, usesMealPlan: true, weightKg: 80, monthlyBudget: 1_000_000 }, undefined, YEAR);
  assert.ok(!r.items.some((i) => i.product.category === 'protein' || i.product.category === 'gainer'));
  assert.ok(r.notes[0].includes('не обязателен'));
});

test('до 18 лет и ограничения по здоровью → без добавок', () => {
  assert.strictEqual(recommend({ ...DEFAULT_PROFILE, birthYear: 2010 }, undefined, YEAR).allowed, false);
  assert.strictEqual(recommend({ ...DEFAULT_PROFILE, healthRestrictions: true }, undefined, YEAR).allowed, false);
});

test('AI-консультант: полный диалог с быстрыми ответами', () => {
  let r = greeting(initialState());
  const steps = ['Набрать массу', '70 кг', '178', '25', '3 раза', 'Всё нормально', '1 млн'];
  for (const s of steps) {
    assert.ok(!r.state.done, `закончил раньше времени на "${s}"`);
    r = replyLocal(r.state, s);
  }
  assert.ok(r.state.done, 'диалог не завершён');
  const rec = r.messages.find((m) => m.recommendation);
  assert.ok(rec, 'нет набора: ' + r.messages.map((m) => m.text).join(' | '));
  assert.ok(rec.recommendation.total <= 1_000_000);
  console.log('   ', r.messages.map((m) => m.text).join('\n    '));
});

test('AI-консультант: всё в одном сообщении', () => {
  let r = greeting(initialState());
  r = replyLocal(r.state, 'Хочу на сушку, 90 кг, рост 182 см, 28 лет, зал 4 раза в неделю, бюджет 1,5 млн');
  assert.strictEqual(r.state.asking, 'lactose');
  r = replyLocal(r.state, 'нет, всё ок');
  assert.ok(r.messages.some((m) => m.recommendation));
});

test('AI-консультант: «дешевле» уменьшает сумму', () => {
  let r = greeting(initialState());
  for (const s of ['масса', '75 кг', '180 см', '27 лет', '4 раза', 'нормально', '2 млн']) r = replyLocal(r.state, s);
  const before = r.messages.find((m) => m.recommendation).recommendation.total;
  r = replyLocal(r.state, 'Подобрать дешевле');
  const after = r.messages.find((m) => m.recommendation);
  assert.ok(after && after.recommendation.total < before, `${before} → ${after && after.recommendation.total}`);
});

test('AI-консультант: несовершеннолетний и здоровье', () => {
  let r = greeting(initialState());
  for (const s of ['масса', '60 кг', '170 см', '16']) r = replyLocal(r.state, s);
  assert.ok(r.messages[0].text.includes('До 18 лет'));
  r = greeting(initialState());
  r = replyLocal(r.state, 'набрать массу, но у меня проблемы с почками');
  assert.ok(r.messages[0].text.includes('врачом'));
});

test('AI-консультант: анкета уже заполнена', () => {
  let r = greeting(initialState({ ...DEFAULT_PROFILE }));
  assert.ok(r.quickReplies.includes('Да, подбери'));
  r = replyLocal(r.state, 'Да, подбери');
  assert.ok(r.messages.some((m) => m.recommendation));
});

console.log(`\nВсе проверки пройдены: ${passed}`);
