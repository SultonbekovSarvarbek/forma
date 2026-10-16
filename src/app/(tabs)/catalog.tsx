import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProductCard } from '@/components/ProductCard';
import { Chip } from '@/components/ui';
import { CATEGORY_LABELS, PRODUCTS } from '@/data/products';
import { GOAL_LABELS } from '@/lib/nutrition';
import { colors, radius, space } from '@/lib/theme';
import type { Goal, ProductCategory } from '@/lib/types';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[];
const GOALS: Goal[] = ['mass', 'cut', 'strength', 'maintain'];

export default function Catalog() {
  const [category, setCategory] = useState<ProductCategory | undefined>();
  const [goal, setGoal] = useState<Goal | undefined>();
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        (!category || p.category === category) &&
        (!goal || p.goals.includes(goal)) &&
        (!q || `${p.brand} ${p.name}`.toLowerCase().includes(q)),
    ).sort((a, b) => Number(b.inStock) - Number(a.inStock));
  }, [category, goal, query]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => <ProductCard product={item} />}
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={{ gap: space.md, marginBottom: space.md }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Поиск: протеин, креатин, бренд…"
            placeholderTextColor={colors.faint}
            style={styles.search}
            clearButtonMode="while-editing"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Все" active={!category} onPress={() => setCategory(undefined)} />
            {CATEGORIES.map((c) => (
              <Chip key={c} label={CATEGORY_LABELS[c]} active={category === c} onPress={() => setCategory(category === c ? undefined : c)} />
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Text style={styles.chipsLabel}>Цель:</Text>
            {GOALS.map((g) => (
              <Chip key={g} label={GOAL_LABELS[g]} active={goal === g} onPress={() => setGoal(goal === g ? undefined : g)} />
            ))}
          </ScrollView>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Ничего не нашли. Попробуй другой фильтр.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xxl },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: space.lg,
    height: 46,
    fontSize: 15,
  },
  chips: { gap: space.sm, alignItems: 'center' },
  chipsLabel: { color: colors.muted, fontSize: 13, marginRight: 2 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: space.xl },
});
