import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Conversation, Message } from '@property-agent/types';
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { api } from '../../services/api';
import { AppGradient, getLeadTone, theme } from '../../components/ui/theme';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [conversations, detail] = await Promise.all([api.getConversations(), api.getConversation(id)]);
      setConversation(conversations.find((item) => item._id === id) ?? null);
      setMessages(detail.messages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleReply() {
    if (!reply.trim()) return;

    setSending(true);
    try {
      await api.replyToConversation(id, reply.trim());
      setReply('');
      await loadData();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reply.';
      Alert.alert('Error', message);
    } finally {
      setSending(false);
    }
  }

  async function updateScore(leadScore: Conversation['leadScore']) {
    await api.updateConversation(id, { leadScore });
    await loadData();
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-canvas">
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={theme.colors.brand} />
          <Text className="mt-3 text-sm font-medium text-muted">Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tone = getLeadTone(conversation?.leadScore ?? 'cold', conversation?.needsHumanReview ?? false);

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={88}>
      <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
        <AppGradient colors={theme.gradients.page} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="border-b border-line-soft px-4 pb-4 pt-2">
          <Animated.View entering={FadeInDown.springify()}>
            <View className="mb-4 flex-row items-center justify-between">
              <TouchableOpacity
                className="h-10 w-10 items-center justify-center rounded-2xl border border-line-brand bg-surface"
                onPress={() => {
                  if (router.canGoBack()) router.back();
                  else router.replace('/(tabs)/leads');
                }}
              >
                <Ionicons name="chevron-back" size={20} color={theme.colors.ink} />
              </TouchableOpacity>

              <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: tone.soft }}>
                <Text className="text-xs font-bold" style={{ color: tone.color }}>{tone.label}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: tone.soft }}>
                <Text className="text-lg font-extrabold" style={{ color: tone.color }}>
                  {(conversation?.tenantName || conversation?.tenantPhone || '?')[0].toUpperCase()}
                </Text>
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold text-ink">{conversation?.tenantName || conversation?.tenantPhone || 'Unknown'}</Text>
                <Text className="mt-1 text-sm text-muted">{conversation?.tenantPhone}</Text>
              </View>
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              {conversation?.qualification?.moveInDate ? (
                <MetaPill
                  icon="calendar-outline"
                  label={new Date(conversation.qualification.moveInDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}
                />
              ) : null}
              {conversation?.qualification?.occupants ? <MetaPill icon="people-outline" label={`${conversation.qualification.occupants} occupants`} /> : null}
              {conversation?.qualification?.employed ? <MetaPill icon="briefcase-outline" label="Employed" accent={theme.colors.sage} /> : null}
            </View>
          </Animated.View>
        </AppGradient>

        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-canvas"
          contentContainerClassName="px-4 py-4"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((message, index) => (
            <MessageBubble key={message._id} message={message} index={index} />
          ))}
          <View className="h-4" />
        </ScrollView>

        <View className="border-t border-line-soft bg-surface px-4 pb-4 pt-4">
          <TouchableOpacity
            className="mb-3 flex-row items-center justify-center rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'rgba(47, 93, 80, 0.1)', borderWidth: 1, borderColor: 'rgba(47, 93, 80, 0.2)' }}
            onPress={() => Linking.openURL(`https://wa.me/${conversation?.tenantPhone?.replace('+', '')}`)}
          >
            <Ionicons name="logo-whatsapp" size={16} color={theme.colors.sage} />
            <Text className="ml-2 text-sm font-semibold text-sage">Open in WhatsApp</Text>
          </TouchableOpacity>

          <View
            className="mb-3 flex-row items-end rounded-2xl border bg-input px-3 py-2"
            style={{ borderColor: inputFocused ? theme.colors.brand : theme.colors.lineBrand }}
          >
            <TextInput
              className="flex-1 py-2 text-sm leading-6 text-ink"
              placeholder="Reply as yourself..."
              placeholderTextColor="#9d8d80"
              value={reply}
              onChangeText={setReply}
              multiline
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              maxLength={500}
            />
            <TouchableOpacity
              className="ml-3 h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: reply.trim() ? theme.colors.brand : '#bca99b' }}
              onPress={handleReply}
              disabled={sending || !reply.trim()}
            >
              {sending ? <ActivityIndicator size="small" color="#fff7f1" /> : <Ionicons name="send" size={14} color="#fff7f1" />}
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-2">
            <ScoreButton label="Hot" accent="#dc2626" soft="rgba(254, 226, 226, 0.92)" onPress={() => updateScore('hot')} />
            <ScoreButton label="Rented" accent="#15803d" soft="rgba(220, 252, 231, 0.92)" onPress={() => updateScore('rejected')} />
            <ScoreButton label="Cold" accent={theme.colors.muted} soft="rgba(247, 239, 230, 0.92)" onPress={() => updateScore('cold')} />
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function MetaPill({
  icon,
  label,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent?: string;
}) {
  return (
    <View className="flex-row items-center rounded-full bg-surface px-3 py-1.5">
      <Ionicons name={icon} size={12} color={accent ?? theme.colors.muted} />
      <Text className="ml-1.5 text-xs font-medium" style={{ color: accent ?? theme.colors.muted }}>
        {label}
      </Text>
    </View>
  );
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const inbound = message.direction === 'inbound';

  return (
    <Animated.View
      entering={inbound ? FadeInLeft.delay(index * 35).springify() : FadeInRight.delay(index * 35).springify()}
      style={{ alignSelf: inbound ? 'flex-start' : 'flex-end', marginBottom: 10, maxWidth: '82%' }}
    >
      {inbound ? (
        <View className="rounded-3xl rounded-bl-lg border border-line-soft bg-surface px-4 py-3 shadow-card">
          <Text className="text-sm leading-6 text-ink">{message.content}</Text>
        </View>
      ) : (
        <AppGradient colors={theme.gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="rounded-3xl rounded-br-lg px-4 py-3 shadow-cta">
          <Text className="text-sm leading-6 text-white">{message.content}</Text>
        </AppGradient>
      )}
      <Text className={`mt-1 text-xs ${inbound ? 'text-left' : 'text-right'} text-muted`}>
        {inbound ? 'Tenant' : 'Aidan (AI)'} · {new Date(message.createdAt || message.sentAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </Animated.View>
  );
}

function ScoreButton({
  label,
  accent,
  soft,
  onPress,
}: {
  label: string;
  accent: string;
  soft: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.96);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
      >
        <View className="items-center rounded-2xl px-3 py-3" style={{ backgroundColor: soft, borderWidth: 1, borderColor: accent }}>
          <Text className="text-xs font-bold" style={{ color: accent }}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
