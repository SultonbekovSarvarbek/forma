/**
 * ТЕСТОВЫЙ AI-консультант: работает локально по правилам, без сети.
 * Позже replyLocal заменяется вызовом своего бэкенда, который ходит в LLM API
 * (Claude / GPT) с инструментами: профиль, calcNorms, поиск по каталогу, корзина.
 * Цифры и подбор при этом всё равно считают calcNorms/recommend — LLM только объясняет.
 */
import { calcNorms, DEFAULT_PROFILE, GOAL_LABELS, recommend, safetyBlock } from './nutrition';
import { formatSum } from './format';
import type { Goal, Profile, Recommendation } from './types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendation?: Recommendation;
}

type Field = 'goal' | 'weightKg' | 'heightCm' | 'age' | 'gymDaysPerWeek' | 'lactose' | 'monthlyBudget';
const FIELD_ORDER: Field[] = ['goal', 'weightKg', 'heightCm', 'age', 'gymDaysPerWeek', 'lactose', 'monthlyBudget'];

export interface ConsultantState {
  draft: Partial<Profile> & { age?: number; lactoseAnswered?: boolean };
  asking?: Field;
  done: boolean;
  /** Профиль из анкеты, если пользователь её заполнил */
  savedProfile?: Profile;
  offeredSaved: boolean;
}

export interface ConsultantReply {
  state: ConsultantState;
  messages: ChatMessage[];
  quickReplies: string[];
}

let counter = 0;
const newId = () => `m${Date.now()}_${counter++}`;
const say = (text: string, recommendation?: Recommendation): ChatMessage => ({ id: newId(), role: 'assistant', text, recommendation });

const QUESTIONS: Record<Field, { text: string; quick: string[] }> = {
  goal: { text: 'Какая у тебя цель?', quick: ['Набрать массу', 'Сушка', 'Держать форму', 'Сила'] },
  weightKg: { text: 'Сколько ты весишь? Например: 75 кг', quick: [] },
  heightCm: { text: 'Какой у тебя рост? Например: 178 см', quick: [] },
  age: { text: 'Сколько тебе лет?', quick: [] },
  gymDaysPerWeek: { text: 'Сколько раз в неделю ходишь в зал?', quick: ['1–2 раза', '3 раза', '4 раза', '5+ раз'] },
  lactose: { text: 'Как переносишь молочное? Есть непереносимость лактозы?', quick: ['Всё нормально', 'Есть непереносимость'] },
  monthlyBudget: { text: 'Какой бюджет на спортпит в месяц?', quick: ['500 тыс', '1 млн', '1,5 млн', '2 млн'] },
};

export function initialState(savedProfile?: Profile): ConsultantState {
  return { draft: {}, done: false, savedProfile, offeredSaved: false };
}

export function greeting(state: ConsultantState): ConsultantReply {
  if (state.savedProfile) {
    const p = state.savedProfile;
    return {
      state: { ...state, offeredSaved: true },
      messages: [
        say(
          `Привет! Я AI-консультант FitBox. Вижу твою анкету: ${p.weightKg} кг, ${p.heightCm} см, цель — ${GOAL_LABELS[p.goal].toLowerCase()}, зал ${p.gymDaysPerWeek} раз в неделю. Подобрать набор по ней?`,
        ),
      ],
      quickReplies: ['Да, подбери', 'Нет, начнём заново'],
    };
  }
  const next = nextField(state);
  return {
    state: { ...state, asking: next },
    messages: [
      say('Привет! Я AI-консультант FitBox. Помогу подобрать спортпит под твою цель и бюджет — задам несколько вопросов.'),
      say(QUESTIONS[next!].text),
    ],
    quickReplies: QUESTIONS[next!].quick,
  };
}

// ---------- разбор сообщений ----------

const num = (s: string) => parseFloat(s.replace(',', '.'));

function parseGoal(t: string): Goal | undefined {
  if (/масс|набр|набор|подкач|мышц/.test(t)) return 'mass';
  if (/суш|похуд|сброс|сбрось|жир|рельеф/.test(t)) return 'cut';
  if (/сил|пауэр|жим/.test(t)) return 'strength';
  if (/форм|поддерж|здоров/.test(t)) return 'maintain';
  return undefined;
}

function parseBudget(t: string): number | undefined {
  const mln = t.match(/(\d+(?:[.,]\d+)?)\s*(млн|миллион|mln)/);
  if (mln) return Math.round(num(mln[1]) * 1_000_000);
  const th = t.match(/(\d+(?:[.,]\d+)?)\s*(тыс|тысяч|k\b|к\b)/);
  if (th) return Math.round(num(th[1]) * 1000);
  const big = t.replace(/\s/g, '').match(/(\d{5,})/);
  if (big) return parseInt(big[1], 10);
  return undefined;
}

function parseGymDays(t: string): number | undefined {
  const m = t.match(/(\d)\s*(?:[-–]\s*\d\s*)?(?:\+\s*)?(раз|р\b|дн|день|дня)/);
  if (m) return Math.min(7, parseInt(m[1], 10));
  if (/кажд(ый|ые) день|ежедневно/.test(t)) return 6;
  if (/не хожу|не занимаюсь|пока нет/.test(t)) return 0;
  return undefined;
}

function hasHealthFlag(t: string): boolean {
  return /почк|печен|беремен|кормлю грудью|лекарств|таблетк|давлен|сердц|диабет|гастрит|язв/.test(t);
}

function applyMessage(state: ConsultantState, raw: string): ConsultantState {
  const t = raw.toLowerCase();
  const d = { ...state.draft };

  if (/девушк|женщин|я жен|я девочк/.test(t)) d.sex = 'female';
  if (/парень|мужчин|я муж/.test(t)) d.sex = 'male';

  const goal = parseGoal(t);
  if (goal && (!d.goal || state.asking === 'goal')) d.goal = goal;

  const w = t.match(/(\d{2,3}(?:[.,]\d)?)\s*(кг|kg|кило)/);
  if (w) d.weightKg = num(w[1]);
  const h = t.match(/(1[3-9]\d|2[0-2]\d)\s*(см|cm|сантим)/);
  if (h) d.heightCm = num(h[1]);
  const a = t.match(/(\d{1,2})\s*(лет|год|года)/);
  if (a) d.age = parseInt(a[1], 10);

  const gym = parseGymDays(t);
  if (gym !== undefined && (state.asking === 'gymDaysPerWeek' || /зал|трен|раз в недел/.test(t))) d.gymDaysPerWeek = gym;

  if (/непереносим|лактоз|молочн\w* (нельзя|плохо|не перенош)|без молочн/.test(t) && !/нормальн|нет непереносим|без проблем/.test(t)) {
    d.lactoseIntolerant = true;
    d.lactoseAnswered = true;
  } else if (state.asking === 'lactose' && /норм|нет|без проблем|переношу|всё ок|все ок/.test(t)) {
    d.lactoseIntolerant = false;
    d.lactoseAnswered = true;
  }

  const budget = state.asking === 'monthlyBudget' || /бюджет|млн|тыс|сум/.test(t) ? parseBudget(t) : undefined;
  if (budget) d.monthlyBudget = budget;

  // Голые числа — по контексту вопроса или по диапазону
  const bare = (t.match(/\d+(?:[.,]\d+)?/g) ?? []).map(num);
  for (const n of bare) {
    if (state.asking === 'age' && d.age === undefined && n >= 10 && n <= 80) d.age = n;
    else if (state.asking === 'weightKg' && d.weightKg === undefined && n >= 35 && n <= 200) d.weightKg = n;
    else if (state.asking === 'heightCm' && d.heightCm === undefined && n >= 130 && n <= 229) d.heightCm = n;
    else if (state.asking === 'gymDaysPerWeek' && d.gymDaysPerWeek === undefined && n >= 0 && n <= 7) d.gymDaysPerWeek = n;
    else if (d.heightCm === undefined && n >= 140 && n <= 220 && !w) d.heightCm = n;
  }

  if (hasHealthFlag(t)) d.healthRestrictions = true;

  return { ...state, draft: d };
}

function nextField(state: ConsultantState): Field | undefined {
  const d = state.draft;
  for (const f of FIELD_ORDER) {
    if (f === 'lactose' && !d.lactoseAnswered) return f;
    if (f === 'age' && d.age === undefined) return f;
    if (f !== 'lactose' && f !== 'age' && d[f] === undefined) return f;
  }
  return undefined;
}

function draftToProfile(state: ConsultantState): Profile {
  const d = state.draft;
  const year = new Date().getFullYear();
  return {
    ...DEFAULT_PROFILE,
    ...(state.savedProfile ?? {}),
    ...d,
    birthYear: d.age !== undefined ? year - d.age : state.savedProfile?.birthYear ?? DEFAULT_PROFILE.birthYear,
    healthRestrictions: d.healthRestrictions ?? state.savedProfile?.healthRestrictions ?? false,
  } as Profile;
}

function buildRecommendation(profile: Profile): ChatMessage[] {
  const block = safetyBlock(profile);
  if (block) return [say(block)];

  const norms = calcNorms(profile);
  const rec = recommend(profile);
  const intro =
    `Твоя норма: около ${norms.kcal} ккал и ${norms.proteinMin}–${norms.proteinMax} г белка в день (цель ~${norms.proteinTarget} г). ` +
    (profile.sex === 'male' ? 'Считал для мужчины — если ты девушка, напиши, пересчитаю.' : '');

  if (rec.items.length === 0) {
    return [say(intro), say(rec.notes.join('\n\n'))];
  }
  return [
    say(intro),
    say(`Собрал набор в пределах ${formatSum(profile.monthlyBudget)}. Итого: ${formatSum(rec.total)}.`, rec),
  ];
}

// ---------- основной ответ ----------

export function replyLocal(state: ConsultantState, userText: string): ConsultantReply {
  const t = userText.toLowerCase().trim();

  if (/заново|сначала|сброс|начн[её]м/.test(t)) {
    const fresh: ConsultantState = { ...initialState(undefined), offeredSaved: true };
    const next = nextField(fresh)!;
    return { state: { ...fresh, asking: next }, messages: [say('Хорошо, начнём заново.'), say(QUESTIONS[next].text)], quickReplies: QUESTIONS[next].quick };
  }

  if (state.savedProfile && state.offeredSaved && !state.done && /^да|подбери|давай/.test(t) && Object.keys(state.draft).length === 0) {
    const profile = state.savedProfile;
    return { state: { ...state, done: true, draft: { ...profile } }, messages: buildRecommendation(profile), quickReplies: ['Подобрать дешевле', 'Без лактозы', 'Начать заново'] };
  }

  // Уточнения после готового подбора
  if (state.done) {
    const profile = draftToProfile(state);
    if (/дешевл|бюджет меньше|дорого/.test(t)) {
      const currentTotal = recommend(profile).total || profile.monthlyBudget;
      const cheaper: Profile = { ...profile, monthlyBudget: Math.max(200_000, Math.floor((currentTotal * 0.75) / 50_000) * 50_000) };
      return { state: { ...state, draft: { ...state.draft, monthlyBudget: cheaper.monthlyBudget } }, messages: buildRecommendation(cheaper), quickReplies: ['Подобрать дешевле', 'Начать заново'] };
    }
    if (/лактоз|молочн/.test(t)) {
      const lf: Profile = { ...profile, lactoseIntolerant: true };
      return { state: { ...state, draft: { ...state.draft, lactoseIntolerant: true, lactoseAnswered: true } }, messages: buildRecommendation(lf), quickReplies: ['Подобрать дешевле', 'Начать заново'] };
    }
    const updated = applyMessage(state, userText);
    if (JSON.stringify(updated.draft) !== JSON.stringify(state.draft)) {
      return { state: updated, messages: [say('Учёл, пересчитал.'), ...buildRecommendation(draftToProfile(updated))], quickReplies: ['Подобрать дешевле', 'Начать заново'] };
    }
    if (/жиросжиг|тестостер|бустер|стероид|анабол/.test(t)) {
      return { state, messages: [say('Такие препараты не советую: польза сомнительная, а риски для здоровья реальные. Лучше база — белок, креатин, сон и питание.')], quickReplies: ['Начать заново'] };
    }
    return {
      state,
      messages: [say('Могу пересчитать набор: напиши новый бюджет, вес или цель. Или нажми «Добавить набор в корзину» выше.')],
      quickReplies: ['Подобрать дешевле', 'Без лактозы', 'Начать заново'],
    };
  }

  const updated = applyMessage(state, userText);

  if (updated.draft.healthRestrictions) {
    return {
      state: { ...updated, done: true },
      messages: [say('Раз есть проблемы со здоровьем или ты принимаешь лекарства, добавки нужно согласовать с врачом. Сам подбирать не буду — но могу помочь с рационом питания.')],
      quickReplies: ['Начать заново'],
    };
  }
  if (updated.draft.age !== undefined && updated.draft.age < 18) {
    return {
      state: { ...updated, done: true },
      messages: [say(safetyBlock({ birthYear: new Date().getFullYear() - updated.draft.age, healthRestrictions: false })!)],
      quickReplies: ['Начать заново'],
    };
  }

  const next = nextField(updated);
  if (next) {
    const understood = next === updated.asking && next === state.asking;
    return {
      state: { ...updated, asking: next },
      messages: [say(understood ? `Не совсем понял. ${QUESTIONS[next].text}` : QUESTIONS[next].text)],
      quickReplies: QUESTIONS[next].quick,
    };
  }

  const profile = draftToProfile(updated);
  return {
    state: { ...updated, asking: undefined, done: true },
    messages: buildRecommendation(profile),
    quickReplies: ['Подобрать дешевле', 'Без лактозы', 'Начать заново'],
  };
}
