import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RecommendationCard } from '@/components/RecommendationCard';
import { Button, Card, Stat } from '@/components/ui';
import { MEAL_PLANS } from '@/data/mealPlans';
import { formatSum } from '@/lib/format';
import { calcNorms, GOAL_LABELS, recommend } from '@/lib/nutrition';
import { colors, radius, space, type } from '@/lib/theme';
import { useStore } from '@/store/AppStore';

export default function MyPlan() {
  const { profile } = useStore();

  if (!profile) {
    return (
      <View style={styles.empty}>
        <Text style={type.h2}>Сначала заполни анкету</Text>
        <Button title="Заполнить анкету" onPress={() => router.replace('/questionnaire')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const norms = calcNorms(profile);
  const rec = recommend(profile);
  const plan = MEAL_PLANS.find((m) => m.goal === profile.goal) ?? MEAL_PLANS[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[type.small, { flex: 1 }]}>
          {profile.sex === 'male' ? 'Мужчина' : 'Женщина'}, {norms.age} лет · {profile.heightCm} см · {profile.weightKg} кг · цель — {GOAL_LABELS[profile.goal].toLowerCase()}
        </Text>
        <Pressable onPress={() => router.push('/questionnaire')} hitSlop={8}>
          <Text style={styles.edit}>Изменить</Text>
        </Pressable>
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={type.h2}>Норма в день</Text>
        <View style={styles.stats}>
          <Stat value={`${norms.kcal}`} label="ккал" />
          <Stat value={`${norms.proteinTarget} г`} label="белок" />
          <Stat value={`${norms.fat} г`} label="жиры" />
          <Stat value={`${norms.carbs} г`} label="углеводы" />
        </View>
        <Text style={type.small}>
          Белок: допустимо {norms.proteinMin}–{norms.proteinMax} г. Из еды ты сейчас получаешь около {norms.proteinFromFood} г
          {norms.proteinGap > 0 ? ` — не хватает ~${norms.proteinGap} г.` : ' — этого достаточно.'}
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={type.h2}>Спортпит под бюджет {formatSum(profile.monthlyBudget)}</Text>
        <RecommendationCard rec={rec} />
      </View>

      {!profile.usesMealPlan ? (
        <Pressable onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}>
          <Card style={styles.planCard}>
            <Ionicons name="restaurant" size={24} color={plan.color} />
            <View style={{ flex: 1 }}>
              <Text style={type.h2}>Не хочешь считать еду?</Text>
              <Text style={type.small}>
                Рацион «{plan.title}»: {plan.kcal} ккал и {plan.protein} г белка в день, от {formatSum(plan.pricePerDay)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Card>
        </Pressable>
      ) : null}

      <Button title="Обсудить с AI-консультантом" icon="sparkles" variant="secondary" onPress={() => router.push('/coach')} />
      <Text style={styles.formula}>Расчёт: формула Миффлина — Сан Жеора, белок 1,6–2,2 г на кг веса. Это не медицинская консультация.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  edit: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  stats: { flexDirection: 'row', gap: space.sm },
  planCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderRadius: radius.lg },
  formula: { color: colors.faint, fontSize: 12, textAlign: 'center' },
});
