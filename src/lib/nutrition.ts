import { MEAL_PLANS } from '@/data/mealPlans';
import { PRODUCTS } from '@/data/products';
import type { Goal, Norms, Product, Profile, Recommendation } from './types';

export const GOAL_LABELS: Record<Goal, string> = {
  mass: 'Масса',
  cut: 'Сушка',
  maintain: 'Поддержание',
  strength: 'Сила',
};

const ACTIVITY_BASE = { sedentary: 1.2, onFeet: 1.3, physical: 1.45 } as const;
const GOAL_KCAL_FACTOR: Record<Goal, number> = { mass: 1.12, cut: 0.82, maintain: 1, strength: 1.05 };
const PROTEIN_PER_KG: Record<Goal, number> = { mass: 1.8, cut: 2.0, maintain: 1.6, strength: 1.8 };
/** Сколько белка в среднем даёт один обычный приём пищи, г (оценка) */
const PROTEIN_PER_REGULAR_MEAL = 28;

const round5 = (n: number) => Math.round(n / 5) * 5;

export function calcNorms(p: Profile, currentYear = new Date().getFullYear()): Norms {
  const age = currentYear - p.birthYear;
  // Формула Миффлина — Сан Жеора
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * age + (p.sex === 'male' ? 5 : -161);
  const gymDays = Math.max(0, Math.min(7, p.gymDaysPerWeek));
  const activity = ACTIVITY_BASE[p.dailyActivity] + 0.055 * gymDays;
  const kcal = round5(bmr * activity * GOAL_KCAL_FACTOR[p.goal]);

  const proteinTarget = round5(p.weightKg * PROTEIN_PER_KG[p.goal]);
  const proteinMin = round5(p.weightKg * 1.6);
  const proteinMax = round5(p.weightKg * 2.2);
  const fat = round5(p.weightKg * (p.goal === 'cut' ? 0.8 : 0.9));
  const carbs = Math.max(0, round5((kcal - proteinTarget * 4 - fat * 9) / 4));

  const plan = p.usesMealPlan ? MEAL_PLANS.find((m) => m.goal === p.goal) ?? MEAL_PLANS[0] : undefined;
  const proteinFromFood = plan ? plan.protein : round5(p.mealsPerDay * PROTEIN_PER_REGULAR_MEAL);
  const proteinGap = Math.max(0, proteinTarget - proteinFromFood);

  return {
    age,
    bmr: Math.round(bmr),
    kcal,
    proteinMin,
    proteinMax,
    proteinTarget,
    fat,
    carbs,
    proteinFromFood,
    proteinGap,
  };
}

/** Проверки, при которых добавки не советуем, а отправляем к врачу */
export function safetyBlock(p: Pick<Profile, 'birthYear' | 'healthRestrictions'>, currentYear = new Date().getFullYear()): string | undefined {
  const age = currentYear - p.birthYear;
  if (age < 18) {
    return 'До 18 лет спортивные добавки не подбираем. Хватит обычной еды с достаточным количеством белка — посоветуйся с тренером или врачом.';
  }
  if (p.healthRestrictions) {
    return 'Ты отметил ограничения по здоровью. В этом случае добавки нужно согласовать с врачом — мы не можем подобрать их сами.';
  }
  return undefined;
}

const pricePerServing = (pr: Product) => pr.price / pr.servings;

function pickCheapest(candidates: Product[], budget: number): Product | undefined {
  return candidates
    .filter((c) => c.inStock && c.price <= budget)
    .sort((a, b) => pricePerServing(a) - pricePerServing(b))[0];
}

function daysOfSupply(product: Product, servingsPerDay: number): number {
  return Math.floor(product.servings / Math.max(0.5, servingsPerDay));
}

export function recommend(p: Profile, catalog: Product[] = PRODUCTS, currentYear = new Date().getFullYear()): Recommendation {
  const blocked = safetyBlock(p, currentYear);
  if (blocked) {
    return { allowed: false, blockedReason: blocked, items: [], total: 0, notes: [] };
  }

  const norms = calcNorms(p, currentYear);
  const items: Recommendation['items'] = [];
  const notes: string[] = [];
  let budgetLeft = p.monthlyBudget;

  // 1. Источник белка (или калорий) — только если реально не хватает
  if (norms.proteinGap > 15) {
    const needsCalories = p.goal === 'mass' && !p.usesMealPlan && p.mealsPerDay <= 3;
    let chosen: { product: Product; reason: string; perDay: number } | undefined;

    if (needsCalories && !p.lactoseIntolerant) {
      const gainer = pickCheapest(catalog.filter((c) => c.category === 'gainer'), budgetLeft);
      if (gainer) {
        chosen = {
          product: gainer,
          perDay: 0.5,
          reason: `Ты ешь ${p.mealsPerDay} раза в день — на массу калорий скорее всего не хватает. Половина порции гейнера добавит ~${Math.round(gainer.kcalPerServing / 2)} ккал и ${Math.round(gainer.proteinPerServing / 2)} г белка.`,
        };
      }
    }

    if (!chosen) {
      const proteins = catalog.filter((c) => c.category === 'protein');
      let pool = proteins;
      let reasonPrefix = '';
      if (p.lactoseIntolerant) {
        pool = proteins.filter((c) => c.lactoseFree);
        reasonPrefix = 'Без лактозы. ';
      } else if (p.goal === 'cut') {
        const isolates = proteins.filter((c) => c.lactoseFree && !c.plantBased);
        pool = pickCheapest(isolates, budgetLeft) ? isolates : proteins;
        reasonPrefix = 'На сушке лучше изолят — меньше углеводов и жиров. ';
      } else {
        pool = proteins.filter((c) => !c.plantBased);
      }
      const protein = pickCheapest(pool, budgetLeft);
      if (protein) {
        const perDay = Math.min(2, Math.ceil(norms.proteinGap / protein.proteinPerServing));
        chosen = {
          product: protein,
          perDay,
          reason: `${reasonPrefix}С едой ты получаешь около ${norms.proteinFromFood} г белка, а нужно ~${norms.proteinTarget} г. Не хватает ~${norms.proteinGap} г.`,
        };
      }
    }

    if (chosen) {
      items.push({
        product: chosen.product,
        reason: chosen.reason,
        dosage: `${chosen.perDay === 0.5 ? '½ порции' : `${chosen.perDay} порц.`} в день — банки хватит на ~${daysOfSupply(chosen.product, chosen.perDay)} дн.`,
      });
      budgetLeft -= chosen.product.price;
    } else {
      notes.push('В твой бюджет не помещается ни один протеин. Увеличь бюджет или начни с добора белка едой: яйца, творог, курица.');
    }
  } else {
    notes.push(
      p.usesMealPlan
        ? `В рационе «${GOAL_LABELS[p.goal]}» уже ~${norms.proteinFromFood} г белка — протеин тебе не обязателен.`
        : 'Белка из еды тебе, скорее всего, хватает — протеин не обязателен.',
    );
  }

  // 2. Креатин — если тренируешься 3+ раза в неделю
  if (p.gymDaysPerWeek >= 3) {
    const creatine = pickCheapest(catalog.filter((c) => c.category === 'creatine'), budgetLeft);
    if (creatine) {
      items.push({
        product: creatine,
        reason: `Ты тренируешься ${p.gymDaysPerWeek} раза в неделю. Креатин — самая изученная добавка для силы и объёма.`,
        dosage: `5 г в день — банки хватит на ~${daysOfSupply(creatine, 1)} дн.`,
      });
      budgetLeft -= creatine.price;
    }
  }

  // 3. Омега-3 — только если остаётся бюджет
  if (items.length > 0) {
    const omega = pickCheapest(catalog.filter((c) => c.id.startsWith('omega3')), budgetLeft);
    if (omega) {
      items.push({
        product: omega,
        reason: 'Остался бюджет — рыбий жир полезен, если редко ешь рыбу.',
        dosage: `2 капсулы в день — на ~${daysOfSupply(omega, 1)} дн.`,
      });
      budgetLeft -= omega.price;
    }
  }

  notes.push('Это не медицинская консультация. При болезнях или приёме лекарств — сначала к врачу.');

  return {
    allowed: true,
    items,
    total: items.reduce((s, i) => s + i.product.price, 0),
    notes,
  };
}

export const DEFAULT_PROFILE: Profile = {
  sex: 'male',
  birthYear: 1998,
  heightCm: 178,
  weightKg: 75,
  goal: 'mass',
  gymDaysPerWeek: 3,
  dailyActivity: 'sedentary',
  mealsPerDay: 3,
  lactoseIntolerant: false,
  healthRestrictions: false,
  monthlyBudget: 1_000_000,
  usesMealPlan: false,
};
