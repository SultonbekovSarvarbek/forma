import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, ProductThumb, Stepper } from '@/components/ui';
import { getPlan, planPrice, TRAINER_CODES } from '@/data/mealPlans';
import { getProduct } from '@/data/products';
import { formatSum } from '@/lib/format';
import { colors, radius, space, type } from '@/lib/theme';
import { useStore } from '@/store/AppStore';

export default function Cart() {
  const { cart, totals, trainerCode, dispatch } = useStore();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>();

  if (cart.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={56} color={colors.faint} />
        <Text style={type.h2}>Корзина пустая</Text>
        <Text style={[type.small, { textAlign: 'center' }]}>Добавь спортпит из каталога или оформи рацион. Не знаешь, что взять — спроси AI.</Text>
        <Button title="Спросить AI-консультанта" icon="sparkles" onPress={() => router.push('/coach')} style={{ alignSelf: 'stretch' }} />
        <Button title="Открыть каталог" variant="secondary" onPress={() => router.push('/catalog')} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  function applyCode() {
    const c = code.trim().toUpperCase();
    if (TRAINER_CODES[c]) {
      dispatch({ type: 'applyCode', code: c });
      setCodeError(undefined);
      setCode('');
    } else {
      setCodeError('Такого кода нет. Для теста: TRENER10');
    }
  }

  function checkout() {
    Alert.alert('Заказ оформлен (тест)', `Сумма ${formatSum(totals.total)}. В рабочей версии здесь будет оплата через Payme, Click или Uzum.`, [
      { text: 'Отлично', onPress: () => dispatch({ type: 'placeOrder' }) },
    ]);
  }

  const appliedTrainer = trainerCode ? TRAINER_CODES[trainerCode] : undefined;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {cart.map((line) => {
        if (line.kind === 'plan') {
          const plan = getPlan(line.planId);
          if (!plan) return null;
          return (
            <Card key="plan" style={styles.line}>
              <View style={[styles.planIcon, { backgroundColor: plan.color }]}>
                <Ionicons name="restaurant" size={24} color={colors.onAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.lineTitle}>Рацион «{plan.title}»</Text>
                <Text style={styles.lineMeta}>
                  Подписка на {line.days} дней · {plan.kcal} ккал/день
                </Text>
                <Text style={styles.linePrice}>{formatSum(planPrice(plan, line.days))}</Text>
              </View>
              <Pressable hitSlop={10} onPress={() => dispatch({ type: 'removePlan' })}>
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </Pressable>
            </Card>
          );
        }
        const p = getProduct(line.productId);
        if (!p) return null;
        return (
          <Card key={line.productId} style={styles.line}>
            <ProductThumb category={p.category} color={p.color} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lineTitle} numberOfLines={2}>
                {p.brand} {p.name}
              </Text>
              <Text style={styles.lineMeta}>{p.size}</Text>
              <Text style={styles.linePrice}>{formatSum(p.price * line.qty)}</Text>
            </View>
            <Stepper value={line.qty} onChange={(qty) => dispatch({ type: 'setQty', productId: p.id, qty })} />
          </Card>
        );
      })}

      <Card style={{ gap: space.md }}>
        <Text style={type.label}>Код тренера</Text>
        {appliedTrainer ? (
          <View style={styles.codeApplied}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            <Text style={{ color: colors.text, flex: 1 }}>
              {trainerCode} — тренер {appliedTrainer.trainer}, −{Math.round(appliedTrainer.discount * 100)}% на спортпит
            </Text>
            <Pressable onPress={() => dispatch({ type: 'applyCode', code: undefined })} hitSlop={8}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.codeRow}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Например, TRENER10"
              placeholderTextColor={colors.faint}
              autoCapitalize="characters"
              style={styles.codeInput}
            />
            <Button title="Применить" variant="secondary" onPress={applyCode} disabled={!code.trim()} />
          </View>
        )}
        {codeError ? <Text style={{ color: colors.danger, fontSize: 13 }}>{codeError}</Text> : null}
      </Card>

      <Card style={{ gap: space.sm }}>
        {totals.products > 0 ? <Row label="Спортпит" value={formatSum(totals.products)} /> : null}
        {totals.plan > 0 ? <Row label="Рацион" value={formatSum(totals.plan)} /> : null}
        {totals.discount > 0 ? <Row label="Скидка по коду" value={`−${formatSum(totals.discount)}`} accent /> : null}
        <Row label="Доставка" value="Бесплатно" />
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Итого</Text>
          <Text style={styles.total}>{formatSum(totals.total)}</Text>
        </View>
      </Card>

      <Button title="Оформить заказ" icon="lock-closed" onPress={checkout} />
    </ScrollView>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={{ color: colors.muted, fontSize: 15 }}>{label}</Text>
      <Text style={{ color: accent ? colors.accent : colors.text, fontSize: 15, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  line: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  planIcon: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  lineTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  lineMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  linePrice: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 4 },
  codeRow: { flexDirection: 'row', gap: space.sm },
  codeInput: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: space.md,
    fontSize: 15,
    minHeight: 50,
  },
  codeApplied: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { color: colors.text, fontSize: 17, fontWeight: '700' },
  total: { color: colors.text, fontSize: 22, fontWeight: '900' },
});
