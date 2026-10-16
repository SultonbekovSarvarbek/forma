import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Chip, Stat } from '@/components/ui';
import { getPlan, PLAN_DURATIONS, planPrice } from '@/data/mealPlans';
import { formatSum } from '@/lib/format';
import { colors, space, type } from '@/lib/theme';
import { useStore } from '@/store/AppStore';

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = getPlan(id);
  const { dispatch, cart } = useStore();
  const [days, setDays] = useState<number>(30);

  if (!plan) {
    return (
      <View style={styles.missing}>
        <Text style={type.body}>Рацион не найден</Text>
      </View>
    );
  }

  const current = cart.find((l) => l.kind === 'plan');
  const isSame = current?.kind === 'plan' && current.planId === plan.id && current.days === days;
  const price = planPrice(plan, days);
  const duration = PLAN_DURATIONS.find((d) => d.days === days);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View>
        <Text style={[type.hero, { color: plan.color }]}>{plan.title}</Text>
        <Text style={type.small}>{plan.subtitle}</Text>
      </View>

      <View style={styles.stats}>
        <Stat value={`${plan.kcal}`} label="ккал" />
        <Stat value={`${plan.protein} г`} label="белок" />
        <Stat value={`${plan.fat} г`} label="жиры" />
        <Stat value={`${plan.carbs} г`} label="углев." />
      </View>

      <View style={{ gap: space.md }}>
        <Text style={type.h2}>Пример дня</Text>
        <Card style={{ gap: space.md }}>
          {plan.sampleDay.map((m) => (
            <View key={m.time} style={styles.meal}>
              <Text style={styles.time}>{m.time}</Text>
              <View style={{ flex: 1 }}>
                <Text style={type.body}>{m.name}</Text>
                <Text style={type.small}>
                  {m.kcal} ккал · {m.protein} г белка
                </Text>
              </View>
            </View>
          ))}
        </Card>
        <Text style={type.small}>Меню меняется каждую неделю. Доставка вечером с 18:00 до 21:30 на следующий день.</Text>
      </View>

      <View style={{ gap: space.md }}>
        <Text style={type.h2}>Срок подписки</Text>
        <View style={styles.durations}>
          {PLAN_DURATIONS.map((d) => (
            <Chip
              key={d.days}
              label={d.discount ? `${d.label} −${Math.round(d.discount * 100)}%` : d.label}
              active={days === d.days}
              onPress={() => setDays(d.days)}
            />
          ))}
        </View>
      </View>

      <Card style={styles.summary}>
        <View>
          <Text style={styles.total}>{formatSum(price)}</Text>
          <Text style={type.small}>
            {formatSum(Math.round(price / days / 1000) * 1000)} в день{duration?.discount ? ' со скидкой' : ''}
          </Text>
        </View>
      </Card>

      <Button
        title={isSame ? 'В корзине — перейти' : current ? 'Заменить рацион в корзине' : 'Оформить подписку'}
        icon={isSame ? 'cart' : 'calendar'}
        variant={isSame ? 'secondary' : 'primary'}
        onPress={() => (isSame ? router.push('/cart') : dispatch({ type: 'setPlan', planId: plan.id, days }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  stats: { flexDirection: 'row', gap: space.sm },
  meal: { flexDirection: 'row', gap: space.md },
  time: { color: colors.accent, fontWeight: '700', width: 46, fontSize: 14, marginTop: 2 },
  durations: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { color: colors.text, fontSize: 26, fontWeight: '900' },
});
