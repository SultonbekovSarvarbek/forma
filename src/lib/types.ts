export type Goal = 'mass' | 'cut' | 'maintain' | 'strength';
export type Sex = 'male' | 'female';
export type DailyActivity = 'sedentary' | 'onFeet' | 'physical';

export type ProductCategory =
  | 'protein'
  | 'gainer'
  | 'creatine'
  | 'amino'
  | 'vitamins'
  | 'bars';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  /** Цена в сумах */
  price: number;
  size: string;
  servings: number;
  /** Белок на порцию, г (0 если не применимо) */
  proteinPerServing: number;
  kcalPerServing: number;
  goals: Goal[];
  lactoseFree: boolean;
  plantBased?: boolean;
  description: string;
  howToUse: string;
  inStock: boolean;
  /** Цвет плашки-заглушки вместо фото */
  color: string;
}

export interface MealPlan {
  id: string;
  goal: Goal;
  title: string;
  subtitle: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  meals: number;
  pricePerDay: number;
  sampleDay: { time: string; name: string; kcal: number; protein: number }[];
  color: string;
}

export interface Profile {
  sex: Sex;
  birthYear: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  gymDaysPerWeek: number;
  dailyActivity: DailyActivity;
  mealsPerDay: number;
  lactoseIntolerant: boolean;
  /** Болезни почек/печени, беременность, приём лекарств */
  healthRestrictions: boolean;
  /** Бюджет на спортпит в месяц, сум */
  monthlyBudget: number;
  usesMealPlan: boolean;
}

export interface Norms {
  age: number;
  bmr: number;
  kcal: number;
  proteinMin: number;
  proteinMax: number;
  proteinTarget: number;
  fat: number;
  carbs: number;
  /** Сколько белка человек скорее всего получает из обычной еды, г */
  proteinFromFood: number;
  proteinGap: number;
}

export interface Recommendation {
  allowed: boolean;
  blockedReason?: string;
  items: { product: Product; reason: string; dosage: string }[];
  total: number;
  notes: string[];
}

export interface CartProductLine {
  kind: 'product';
  productId: string;
  qty: number;
}

export interface CartPlanLine {
  kind: 'plan';
  planId: string;
  days: number;
}

export type CartLine = CartProductLine | CartPlanLine;
