import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatSum } from '@/lib/format';
import { colors, radius, space } from '@/lib/theme';
import type { Product } from '@/lib/types';
import { useStore } from '@/store/AppStore';
import { ProductThumb } from './ui';

export function ProductCard({ product }: { product: Product }) {
  const { dispatch, cart } = useStore();
  const inCart = cart.some((l) => l.kind === 'product' && l.productId === product.id);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <ProductThumb category={product.category} color={product.color} />
      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.meta}>
          {product.size}
          {product.proteinPerServing ? ` · ${product.proteinPerServing} г белка/порц.` : ''}
        </Text>
        <Text style={styles.price}>{formatSum(product.price)}</Text>
      </View>
      {product.inStock ? (
        <Pressable
          accessibilityLabel="Добавить в корзину"
          hitSlop={8}
          onPress={() => dispatch({ type: 'addProduct', productId: product.id })}
          style={[styles.add, inCart && { backgroundColor: colors.surface2 }]}
        >
          <Ionicons name={inCart ? 'checkmark' : 'add'} size={22} color={inCart ? colors.accent : colors.onAccent} />
        </Pressable>
      ) : (
        <Text style={styles.out}>Нет в наличии</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: { flex: 1 },
  brand: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  name: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 1 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  price: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 4 },
  add: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  out: { color: colors.faint, fontSize: 11, width: 60, textAlign: 'right' },
});
