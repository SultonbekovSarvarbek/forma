import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, ProductThumb, Stat } from '@/components/ui';
import { CATEGORY_LABELS, getProduct } from '@/data/products';
import { formatSum } from '@/lib/format';
import { GOAL_LABELS } from '@/lib/nutrition';
import { colors, radius, space, type } from '@/lib/theme';
import { useStore } from '@/store/AppStore';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getProduct(id);
  const { dispatch, cart } = useStore();

  if (!product) {
    return (
      <View style={styles.missing}>
        <Text style={type.body}>Товар не найден</Text>
      </View>
    );
  }

  const inCart = cart.find((l) => l.kind === 'product' && l.productId === product.id);
  const perServing = Math.round(product.price / product.servings / 100) * 100;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: product.color }]}>
        <ProductThumb category={product.category} color="rgba(0,0,0,0.25)" size={120} />
      </View>

      <View style={{ gap: 4 }}>
        <Text style={type.label}>
          {CATEGORY_LABELS[product.category]} · {product.brand}
        </Text>
        <Text style={type.h1}>{product.name}</Text>
        <Text style={type.small}>{product.size}</Text>
      </View>

      <Text style={styles.price}>{formatSum(product.price)}</Text>

      <View style={styles.stats}>
        <Stat value={`${product.servings}`} label="порций" />
        {product.proteinPerServing ? <Stat value={`${product.proteinPerServing} г`} label="белка в порции" /> : null}
        <Stat value={formatSum(perServing).replace(' сум', '')} label="сум за порцию" />
      </View>

      <View style={styles.tags}>
        {product.goals.map((g) => (
          <Text key={g} style={styles.tag}>
            {GOAL_LABELS[g]}
          </Text>
        ))}
        {product.lactoseFree ? <Text style={[styles.tag, styles.tagInfo]}>Без лактозы</Text> : null}
        {product.plantBased ? <Text style={[styles.tag, styles.tagInfo]}>Растительный</Text> : null}
      </View>

      <Card style={{ gap: space.md }}>
        <Text style={type.body}>{product.description}</Text>
        <View>
          <Text style={type.label}>Как принимать</Text>
          <Text style={[type.body, { marginTop: 4 }]}>{product.howToUse}</Text>
        </View>
      </Card>

      <Text style={styles.original}>Оригинал от официального дистрибьютора (тестовая отметка — в рабочей версии здесь будут документы на партию).</Text>

      {product.inStock ? (
        <Button
          title={inCart ? 'В корзине — перейти' : 'Добавить в корзину'}
          icon={inCart ? 'cart' : 'add-circle'}
          variant={inCart ? 'secondary' : 'primary'}
          onPress={() => (inCart ? router.push('/cart') : dispatch({ type: 'addProduct', productId: product.id }))}
        />
      ) : (
        <Button title="Нет в наличии" disabled onPress={() => {}} variant="secondary" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  hero: { height: 220, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  price: { color: colors.text, fontSize: 28, fontWeight: '900' },
  stats: { flexDirection: 'row', gap: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tag: {
    color: colors.text,
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    overflow: 'hidden',
    fontSize: 13,
  },
  tagInfo: { color: colors.info },
  original: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
