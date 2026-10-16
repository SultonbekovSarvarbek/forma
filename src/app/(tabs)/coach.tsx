import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecommendationCard } from '@/components/RecommendationCard';
import { greeting, initialState, replyLocal, type ChatMessage, type ConsultantState } from '@/lib/consultant';
import { colors, radius, space } from '@/lib/theme';
import type { Profile } from '@/lib/types';
import { useStore } from '@/store/AppStore';

interface Session {
  /** Профиль, для которого начат диалог: если заполнили анкету, диалог начинается заново */
  forProfile: Profile | undefined;
  consultant: ConsultantState;
  messages: ChatMessage[];
  quick: string[];
}

function startSession(profile: Profile | undefined): Session {
  const r = greeting(initialState(profile));
  return { forProfile: profile, consultant: r.state, messages: r.messages, quick: r.quickReplies };
}

export default function Coach() {
  const { profile } = useStore();
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session>(() => startSession(profile));
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  if (session.forProfile !== profile) {
    setSession(startSession(profile));
  }
  const { messages, quick } = session;

  function send(text: string) {
    const clean = text.trim();
    if (!clean || typing) return;
    setInput('');
    setSession((s) => ({ ...s, quick: [], messages: [...s.messages, { id: `u${Date.now()}`, role: 'user', text: clean }] }));
    setTyping(true);
    // Имитация задержки ответа сети. Здесь будет запрос к бэкенду с LLM.
    setTimeout(() => {
      setSession((s) => {
        const r = replyLocal(s.consultant, clean);
        return { ...s, consultant: r.state, messages: [...s.messages, ...r.messages], quick: r.quickReplies };
      });
      setTyping(false);
    }, 600);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding" keyboardVerticalOffset={insets.top + 44 /* высота шапки iOS */}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={{ gap: space.sm }}>
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, item.role === 'user' && { color: colors.onAccent }]}>{item.text}</Text>
            </View>
            {item.recommendation ? <RecommendationCard rec={item.recommendation} /> : null}
          </View>
        )}
        ListFooterComponent={typing ? <Text style={styles.typing}>Консультант печатает…</Text> : undefined}
      />

      {quick.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick} keyboardShouldPersistTaps="handled">
          {quick.map((q) => (
            <Pressable key={q} onPress={() => send(q)} style={styles.quickChip}>
              <Text style={styles.quickText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Напиши, что хочешь: массу, сушку, бюджет…"
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
          onSubmitEditing={() => send(input)}
          submitBehavior="submit"
          returnKeyType="send"
        />
        <Pressable
          accessibilityLabel="Отправить"
          onPress={() => send(input)}
          disabled={!input.trim() || typing}
          style={[styles.send, (!input.trim() || typing) && { opacity: 0.4 }]}
        >
          <Ionicons name="arrow-up" size={20} color={colors.onAccent} />
        </Pressable>
      </View>
      <Text style={styles.disclaimer}>Тестовый AI работает по правилам без интернета. Это не медицинская консультация.</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space.lg, gap: space.md },
  bubble: { maxWidth: '85%', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface2, borderBottomLeftRadius: 6 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.accent, borderBottomRightRadius: 6 },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  typing: { color: colors.muted, fontSize: 13, marginTop: space.sm },
  quick: { paddingHorizontal: space.lg, gap: space.sm, paddingBottom: space.sm },
  quickChip: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: { color: colors.faint, fontSize: 11, textAlign: 'center', paddingVertical: space.sm },
});
