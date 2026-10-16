import type { MealPlan } from '@/lib/types';

/** ТЕСТОВЫЕ ДАННЫЕ. Меню и цены — до договора с кухней-партнёром. */
export const MEAL_PLANS: MealPlan[] = [
  {
    id: 'mass',
    goal: 'mass',
    title: 'Масса',
    subtitle: 'Набор мышечной массы',
    kcal: 2600,
    protein: 180,
    fat: 80,
    carbs: 290,
    meals: 6,
    pricePerDay: 150_000,
    color: '#C6F432',
    sampleDay: [
      { time: '08:00', name: 'Омлет из 4 яиц, овсянка с бананом', kcal: 620, protein: 38 },
      { time: '11:00', name: 'Творог с ягодами и мёдом', kcal: 330, protein: 30 },
      { time: '14:00', name: 'Куриное филе, бурый рис, овощи', kcal: 640, protein: 46 },
      { time: '17:00', name: 'Сэндвич с индейкой, йогурт', kcal: 380, protein: 26 },
      { time: '20:00', name: 'Говядина, гречка, салат', kcal: 520, protein: 34 },
      { time: '22:00', name: 'Кефир, орехи', kcal: 110, protein: 6 },
    ],
  },
  {
    id: 'cut',
    goal: 'cut',
    title: 'Сушка',
    subtitle: 'Минус жир, мышцы на месте',
    kcal: 1800,
    protein: 170,
    fat: 55,
    carbs: 150,
    meals: 5,
    pricePerDay: 140_000,
    color: '#5BD2F0',
    sampleDay: [
      { time: '08:00', name: 'Яичные белки, авокадо, цельнозерновой хлеб', kcal: 380, protein: 32 },
      { time: '11:00', name: 'Греческий йогурт, ягоды', kcal: 210, protein: 22 },
      { time: '14:00', name: 'Куриная грудка, киноа, брокколи', kcal: 480, protein: 50 },
      { time: '17:00', name: 'Тунец, огурцы, зелень', kcal: 260, protein: 34 },
      { time: '20:00', name: 'Рыба на пару, овощи гриль', kcal: 470, protein: 32 },
    ],
  },
  {
    id: 'maintain',
    goal: 'maintain',
    title: 'Поддержание',
    subtitle: 'Держать форму без перебора',
    kcal: 2200,
    protein: 140,
    fat: 70,
    carbs: 240,
    meals: 5,
    pricePerDay: 130_000,
    color: '#F5B841',
    sampleDay: [
      { time: '08:00', name: 'Сырники, сметана 10%, фрукты', kcal: 480, protein: 28 },
      { time: '11:00', name: 'Хумус, овощные палочки', kcal: 250, protein: 10 },
      { time: '14:00', name: 'Плов с курицей, салат', kcal: 650, protein: 42 },
      { time: '17:00', name: 'Протеиновый смузи', kcal: 300, protein: 25 },
      { time: '20:00', name: 'Индейка, булгур, овощи', kcal: 520, protein: 35 },
    ],
  },
];

export const PLAN_DURATIONS = [
  { days: 7, discount: 0, label: '7 дней' },
  { days: 14, discount: 0.05, label: '14 дней' },
  { days: 30, discount: 0.1, label: '30 дней' },
] as const;

export function getPlan(id: string): MealPlan | undefined {
  return MEAL_PLANS.find((p) => p.id === id);
}

export function planPrice(plan: MealPlan, days: number): number {
  const d = PLAN_DURATIONS.find((x) => x.days === days);
  const discount = d ? d.discount : 0;
  return Math.round((plan.pricePerDay * days * (1 - discount)) / 1000) * 1000;
}

/** Тестовые промокоды тренеров: код → скидка на спортпит */
export const TRAINER_CODES: Record<string, { trainer: string; discount: number }> = {
  TRENER10: { trainer: 'Азиз (Chekhov Fitness)', discount: 0.1 },
  BAKHA10: { trainer: 'Бахтиёр (Power Gym)', discount: 0.1 },
};
