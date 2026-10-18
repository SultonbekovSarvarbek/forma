import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/ProductCard';
import { Button, Card, SectionTitle, Stat } from '@/components/ui';
import { MEAL_PLANS } from '@/data/mealPlans';
import { PRODUCTS } from '@/data/products';
import { formatSum } from '@/lib/format';
import { calcNorms, GOAL_LABELS } from '@/lib/nutrition';
import { colors, radius, space, type } from '@/lib/theme';
import { useStore } from '@/store/AppStore';

const POPULAR = ['on-gold-whey-2270', 'on-creatine-300', 'mutant-mass-2270', 'on-isolate-1360'];

export default function Home() {
  const insets = useSafeAreaInsets();
  const { profile } = useStore();
  const norms = profile ? calcNorms(profile) : undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}>
      <Text style={styles.logo}>
        Fit<Text style={{ color: colors.accent }}>Box</Text>
      </Text>
      <Text style={styles.tagline}>Спортпит и рационы для тех, кто тренируется</Text>

      {profile && norms ? (
        <Card style={{ gap: space.md }}>
          <View style={styles.rowBetween}>
            <Text style={type.label}>Твоя норма в день</Text>
            <Text style={styles.goalBadge}>{GOAL_LABELS[profile.goal]}</Text>
          </View>
          <View style={styles.stats}>
            <Stat value={`${norms.kcal}`} label="ккал" />
            <Stat value={`${norms.proteinTarget} г`} label="белок" />
            <Stat value={`${norms.carbs} г`} label="углеводы" />
          </View>
          <Button title="Мой план и подбор спортпита" icon="arrow-forward" onPress={() => router.push('/my-plan')} />
        </Card>
      ) : (
        <Card style={{ gap: space.md }}>
          <Text style={type.h2}>Узнай свою норму за минуту</Text>
          <Text style={type.small}>
            Рост, вес, цель и сколько раз ходишь в зал — посчитаем калории и белок и подберём спортпит под бюджет.
          </Text>
          <Button title="Заполнить анкету" icon="create" onPress={() => router.push('/questionnaire')} />
        </Card>
      )}

      <Pressable onPress={() => router.push('/coach')} style={({ pressed }) => [styles.aiBanner, pressed && { opacity: 0.9 }]}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={22} color={colors.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiTitle}>Не знаешь, что купить?</Text>
          <Text style={styles.aiText}>Спроси AI-консультанта — соберёт набор под цель и бюджет</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.onAccent} />
      </Pressable>

      <View>
        <SectionTitle title="Рационы с доставкой" action="Все" onAction={() => router.push('/meals')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md }}>
          {MEAL_PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}
              style={({ pressed }) => [styles.planCard, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.planDot, { backgroundColor: plan.color }]} />
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planMeta}>
                {plan.kcal} ккал · {plan.protein} г белка
              </Text>
              <Text style={styles.planPrice}>от {formatSum(plan.pricePerDay)}/день</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: space.md }}>
        <SectionTitle title="Популярное" action="Каталог" onAction={() => router.push('/catalog')} />
        {POPULAR.map((id) => {
          const p = PRODUCTS.find((x) => x.id === id);
          return p ? <ProductCard key={id} product={p} /> : null;
        })}
      </View>

      <Text style={styles.testNote}>Тестовая версия: товары, цены и рационы условные, оплата не списывается.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  logo: { fontSize: 38, fontWeight: '900', color: colors.text, letterSpacing: -1.2 },
  tagline: { color: colors.muted, fontSize: 15, marginTop: -space.lg },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalBadge: {
    color: colors.onAccent,
    backgroundColor: colors.accent,
    fontWeight: '700',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  stats: { flexDirection: 'row', gap: space.sm },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13,14,16,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { color: colors.onAccent, fontSize: 17, fontWeight: '800' },
  aiText: { color: colors.onAccent, fontSize: 13, marginTop: 2, opacity: 0.8 },
  planCard: {
    width: 170,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    gap: 4,
  },
  planDot: { width: 28, height: 6, borderRadius: 3, marginBottom: space.sm },
  planTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  planMeta: { color: colors.muted, fontSize: 12 },
  planPrice: { color: colors.text, fontSize: 13, fontWeight: '700', marginTop: space.sm },
  testNote: { color: colors.faint, fontSize: 12, textAlign: 'center' },
});
