import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatSum } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import type { Recommendation } from '@/lib/types';
import { useStore } from '@/store/AppStore';
import { Button, ProductThumb } from './ui';

/** Набор спортпита от анкеты или AI-консультанта, с кнопкой «Добавить набор в корзину» */
export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const { dispatch } = useStore();
  const [added, setAdded] = useState(false);

  if (!rec.allowed) {
    return (
      <View style={[styles.card, { borderColor: colors.warn }]}>
        <Text style={styles.blocked}>{rec.blockedReason}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {rec.items.map((i) => (
        <View key={i.product.id} style={styles.item}>
          <ProductThumb category={i.product.category} color={i.product.color} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {i.product.brand} {i.product.name}
            </Text>
            <Text style={styles.meta}>
              {i.product.size} · {formatSum(i.product.price)}
            </Text>
            <Text style={styles.reason}>{i.reason}</Text>
            <Text style={styles.dosage}>{i.dosage}</Text>
          </View>
        </View>
      ))}

      {rec.items.length > 0 ? (
        <>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Итого</Text>
            <Text style={styles.total}>{formatSum(rec.total)}</Text>
          </View>
          <Button
            title={added ? 'В корзине — перейти' : 'Добавить набор в корзину'}
            icon={added ? 'cart' : 'add-circle'}
            variant={added ? 'secondary' : 'primary'}
            onPress={() => {
              if (added) {
                router.push('/cart');
                return;
              }
              rec.items.forEach((i) => dispatch({ type: 'addProduct', productId: i.product.id }));
              setAdded(true);
            }}
          />
        </>
      ) : null}

      {rec.notes.map((n) => (
        <Text key={n} style={styles.note}>
          {n}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  item: { flexDirection: 'row', gap: space.md },
  name: { color: colors.text, fontWeight: '700', fontSize: 14 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  reason: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 6 },
  dosage: { color: colors.accent, fontSize: 12, fontWeight: '600', marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.md,
  },
  totalLabel: { color: colors.muted, fontSize: 15 },
  total: { color: colors.text, fontSize: 17, fontWeight: '800' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  blocked: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
