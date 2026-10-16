import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { getPlan, planPrice, TRAINER_CODES } from '@/data/mealPlans';
import { getProduct } from '@/data/products';
import type { CartLine, Profile } from '@/lib/types';

/** Состояние приложения в памяти. Тестовый режим: после перезапуска всё сбрасывается. */
interface State {
  profile?: Profile;
  cart: CartLine[];
  trainerCode?: string;
  ordersPlaced: number;
}

type Action =
  | { type: 'setProfile'; profile: Profile }
  | { type: 'addProduct'; productId: string; qty?: number }
  | { type: 'setQty'; productId: string; qty: number }
  | { type: 'setPlan'; planId: string; days: number }
  | { type: 'removePlan' }
  | { type: 'applyCode'; code?: string }
  | { type: 'placeOrder' };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case 'setProfile':
      return { ...state, profile: a.profile };
    case 'addProduct': {
      const qty = a.qty ?? 1;
      const existing = state.cart.find((l) => l.kind === 'product' && l.productId === a.productId);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((l) => (l.kind === 'product' && l.productId === a.productId ? { ...l, qty: l.qty + qty } : l)),
        };
      }
      return { ...state, cart: [...state.cart, { kind: 'product', productId: a.productId, qty }] };
    }
    case 'setQty':
      return {
        ...state,
        cart: state.cart
          .map((l) => (l.kind === 'product' && l.productId === a.productId ? { ...l, qty: a.qty } : l))
          .filter((l) => l.kind !== 'product' || l.qty > 0),
      };
    case 'setPlan':
      // В корзине может быть только одна подписка на рацион
      return { ...state, cart: [...state.cart.filter((l) => l.kind !== 'plan'), { kind: 'plan', planId: a.planId, days: a.days }] };
    case 'removePlan':
      return { ...state, cart: state.cart.filter((l) => l.kind !== 'plan') };
    case 'applyCode':
      return { ...state, trainerCode: a.code };
    case 'placeOrder':
      return { ...state, cart: [], trainerCode: undefined, ordersPlaced: state.ordersPlaced + 1 };
  }
}

export interface Totals {
  products: number;
  plan: number;
  discount: number;
  total: number;
  itemsCount: number;
}

interface Store extends State {
  dispatch: (a: Action) => void;
  totals: Totals;
}

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { cart: [], ordersPlaced: 0 });

  const totals = useMemo<Totals>(() => {
    let products = 0;
    let plan = 0;
    let itemsCount = 0;
    for (const l of state.cart) {
      if (l.kind === 'product') {
        const p = getProduct(l.productId);
        if (p) products += p.price * l.qty;
        itemsCount += l.qty;
      } else {
        const p = getPlan(l.planId);
        if (p) plan += planPrice(p, l.days);
        itemsCount += 1;
      }
    }
    const code = state.trainerCode ? TRAINER_CODES[state.trainerCode] : undefined;
    // Скидка тренера — только на спортпит, рацион не трогаем
    const discount = code ? Math.round(products * code.discount) : 0;
    return { products, plan, discount, total: products + plan - discount, itemsCount };
  }, [state.cart, state.trainerCode]);

  const value = useMemo(() => ({ ...state, dispatch, totals }), [state, totals]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore вне AppStoreProvider');
  return s;
}
