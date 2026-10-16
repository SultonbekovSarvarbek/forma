import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MEAL_PLANS } from '@/data/mealPlans';
import { formatSum } from '@/lib/format';
import { colors, radius, space, type } from '@/lib/theme';
import { useStore } from '@/store/AppStore';

const HOW = [
  { icon: 'options' as const, text: 'Выбираешь рацион под цель и срок: 7, 14 или 30 дней' },
  { icon: 'moon' as const, text: 'Каждый вечер курьер привозит 5–6 боксов на завтра' },
  { icon: 'pause-circle' as const, text: 'Уехал или заболел — ставишь паузу в приложении' },
];

export default function Meals() {
  const { profile } = useStore();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={type.small}>Готовая еда с подсчитанным КБЖУ. Доставка по Ташкенту бесплатно, вечером накануне.</Text>

      {MEAL_PLANS.map((plan) => {
        const recommended = profile?.goal === plan.goal || (profile?.goal === 'strength' && plan.goal === 'mass');
        return (
          <Pressable
            key={plan.id}
            onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}
            style={({ pressed }) => [styles.card, recommended && { borderColor: plan.color }, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={[styles.title, { color: plan.color }]}>{plan.title}</Text>
                <Text style={styles.subtitle}>{plan.subtitle}</Text>
              </View>
              {recommended ? <Text style={[styles.badge, { backgroundColor: plan.color }]}>Под твою цель</Text> : null}
            </View>
            <View style={styles.macros}>
              <Macro value={plan.kcal} unit="ккал" />
              <Macro value={plan.protein} unit="белок, г" />
              <Macro value={plan.fat} unit="жиры, г" />
              <Macro value={plan.carbs} unit="углев., г" />
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.price}>{formatSum(plan.pricePerDay)} / день</Text>
              <Text style={styles.meals}>
                {plan.meals} приёмов <Ionicons name="chevron-forward" size={13} color={colors.muted} />
              </Text>
            </View>
          </Pressable>
        );
      })}

      <View style={styles.how}>
        <Text style={type.h2}>Как работает подписка</Text>
        {HOW.map((h) => (
          <View key={h.text} style={styles.howRow}>
            <Ionicons name={h.icon} size={20} color={colors.accent} />
            <Text style={styles.howText}>{h.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Macro({ value, unit }: { value: number; unit: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: space.lg,
    gap: space.lg,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  badge: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  macros: { flexDirection: 'row' },
  macroValue: { color: colors.text, fontSize: 18, fontWeight: '800' },
  macroUnit: { color: colors.muted, fontSize: 11 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { color: colors.text, fontSize: 16, fontWeight: '800' },
  meals: { color: colors.muted, fontSize: 13 },
  how: { gap: space.md, marginTop: space.sm },
  howRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  howText: { color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 },
});
