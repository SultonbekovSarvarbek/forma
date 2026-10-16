import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space, type } from '@/lib/theme';
import type { ProductCategory } from '@/lib/types';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = variant === 'primary' ? colors.onAccent : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && { backgroundColor: colors.accent },
        variant === 'secondary' && { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}
    >
      <Text style={[styles.chipText, active && { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={type.h2}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const CATEGORY_ICON: Record<ProductCategory, IconName> = {
  protein: 'barbell',
  gainer: 'trending-up',
  creatine: 'flash',
  amino: 'water',
  vitamins: 'medkit',
  bars: 'nutrition',
};

/** Заглушка вместо фото товара */
export function ProductThumb({ category, color, size = 64 }: { category: ProductCategory; color: string; size?: number }) {
  return (
    <View style={[styles.thumb, { width: size, height: size, backgroundColor: color }]}>
      <Ionicons name={CATEGORY_ICON[category]} size={size * 0.42} color={colors.accent} />
    </View>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <View style={styles.stepper}>
      <Pressable hitSlop={8} onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn}>
        <Ionicons name="remove" size={16} color={colors.text} />
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable hitSlop={8} onPress={() => onChange(value + 1)} style={styles.stepBtn}>
        <Ionicons name="add" size={16} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.md },
  sectionAction: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  thumb: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  stat: { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, padding: space.md },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: radius.pill },
  stepBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepValue: { color: colors.text, fontWeight: '700', minWidth: 20, textAlign: 'center' },
});
