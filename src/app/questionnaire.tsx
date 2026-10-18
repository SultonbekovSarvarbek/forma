import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Chip } from '@/components/ui';
import { DEFAULT_PROFILE, GOAL_LABELS } from '@/lib/nutrition';
import { colors, radius, space, type } from '@/lib/theme';
import type { DailyActivity, Goal, Profile, Sex } from '@/lib/types';
import { useStore } from '@/store/AppStore';

const GOALS: Goal[] = ['mass', 'cut', 'maintain', 'strength'];
const ACTIVITY: { value: DailyActivity; label: string }[] = [
  { value: 'sedentary', label: 'Сидячая работа' },
  { value: 'onFeet', label: 'Много на ногах' },
  { value: 'physical', label: 'Физический труд' },
];
const BUDGETS = [
  { value: 500_000, label: '500 тыс' },
  { value: 1_000_000, label: '1 млн' },
  { value: 1_500_000, label: '1,5 млн' },
  { value: 2_000_000, label: '2 млн' },
];

export default function Questionnaire() {
  const { profile, dispatch } = useStore();
  const start = profile ?? DEFAULT_PROFILE;
  const [p, setP] = useState<Profile>(start);
  const [text, setText] = useState({
    birthYear: profile ? String(start.birthYear) : '',
    heightCm: profile ? String(start.heightCm) : '',
    weightKg: profile ? String(start.weightKg) : '',
  });

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setP((prev) => ({ ...prev, [key]: value }));

  const year = new Date().getFullYear();
  const birthYear = parseInt(text.birthYear, 10);
  const heightCm = parseFloat(text.heightCm.replace(',', '.'));
  const weightKg = parseFloat(text.weightKg.replace(',', '.'));
  const errors = {
    birthYear: !(birthYear >= year - 90 && birthYear <= year - 10) ? 'Год рождения, например 1998' : undefined,
    heightCm: !(heightCm >= 120 && heightCm <= 230) ? 'Рост в сантиметрах' : undefined,
    weightKg: !(weightKg >= 35 && weightKg <= 250) ? 'Вес в килограммах' : undefined,
  };
  const valid = !errors.birthYear && !errors.heightCm && !errors.weightKg;

  function save() {
    if (!valid) return;
    dispatch({ type: 'setProfile', profile: { ...p, birthYear, heightCm, weightKg } });
    router.replace('/my-plan');
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.small}>Анализы не нужны — только базовые данные. По ним посчитаем норму калорий и белка и подберём спортпит.</Text>

        <Field label="Пол">
          <Row>
            {(['male', 'female'] as Sex[]).map((s) => (
              <Chip key={s} label={s === 'male' ? 'Мужской' : 'Женский'} active={p.sex === s} onPress={() => set('sex', s)} />
            ))}
          </Row>
        </Field>

        <View style={styles.inputs}>
          <NumberInput label="Год рождения" value={text.birthYear} placeholder="1998" error={text.birthYear ? errors.birthYear : undefined} onChange={(v) => setText((t) => ({ ...t, birthYear: v }))} />
          <NumberInput label="Рост, см" value={text.heightCm} placeholder="178" error={text.heightCm ? errors.heightCm : undefined} onChange={(v) => setText((t) => ({ ...t, heightCm: v }))} />
          <NumberInput label="Вес, кг" value={text.weightKg} placeholder="75" error={text.weightKg ? errors.weightKg : undefined} onChange={(v) => setText((t) => ({ ...t, weightKg: v }))} />
        </View>

        <Field label="Цель">
          <Row>
            {GOALS.map((g) => (
              <Chip key={g} label={GOAL_LABELS[g]} active={p.goal === g} onPress={() => set('goal', g)} />
            ))}
          </Row>
        </Field>

        <Field label="Сколько раз в неделю в зале">
          <Row>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <Chip key={n} label={n === 6 ? '6+' : String(n)} active={p.gymDaysPerWeek === n} onPress={() => set('gymDaysPerWeek', n)} />
            ))}
          </Row>
        </Field>

        <Field label="Активность в течение дня">
          <Row>
            {ACTIVITY.map((a) => (
              <Chip key={a.value} label={a.label} active={p.dailyActivity === a.value} onPress={() => set('dailyActivity', a.value)} />
            ))}
          </Row>
        </Field>

        <Field label="Сколько раз в день ешь">
          <Row>
            {[2, 3, 4, 5].map((n) => (
              <Chip key={n} label={n === 5 ? '5+' : String(n)} active={p.mealsPerDay === n} onPress={() => set('mealsPerDay', n)} />
            ))}
          </Row>
        </Field>

        <Field label="Бюджет на спортпит в месяц">
          <Row>
            {BUDGETS.map((b) => (
              <Chip key={b.value} label={b.label} active={p.monthlyBudget === b.value} onPress={() => set('monthlyBudget', b.value)} />
            ))}
          </Row>
        </Field>

        <View style={styles.switches}>
          <Toggle label="Беру рацион FitBox" hint="Тогда учтём белок из рациона" value={p.usesMealPlan} onChange={(v) => set('usesMealPlan', v)} />
          <Toggle label="Непереносимость лактозы" value={p.lactoseIntolerant} onChange={(v) => set('lactoseIntolerant', v)} />
          <Toggle
            label="Есть ограничения по здоровью"
            hint="Болезни почек или печени, беременность, приём лекарств"
            value={p.healthRestrictions}
            onChange={(v) => set('healthRestrictions', v)}
          />
        </View>

        <Button title="Посчитать мою норму" icon="calculator" onPress={save} disabled={!valid} />
        <Text style={styles.disclaimer}>Это не медицинская консультация. Данные хранятся только на телефоне (тестовая версия).</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={type.label}>{label}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

function NumberInput({ label, value, placeholder, error, onChange }: { label: string; value: string; placeholder: string; error?: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.faint}
        keyboardType="decimal-pad"
        maxLength={5}
        style={[styles.input, error && { borderColor: colors.danger }]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={type.body}>{label}</Text>
        {hint ? <Text style={type.small}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent, false: colors.surface2 }} thumbColor={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl },
  inputs: { flexDirection: 'row', gap: space.sm },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    height: 50,
    paddingHorizontal: space.md,
    fontSize: 17,
    fontWeight: '700',
  },
  error: { color: colors.danger, fontSize: 11 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  switches: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.lg },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  disclaimer: { color: colors.faint, fontSize: 12, textAlign: 'center' },
});
