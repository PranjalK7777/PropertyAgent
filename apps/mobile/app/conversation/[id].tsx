import { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Linking, Alert, ActivityIndicator, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../services/api';
import { Conversation, Message } from '@property-agent/types';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInDown, FadeInLeft, FadeInRight, ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SCORE_CONFIG: Record<string, { color: string; bg: string; label: string; icon: any }> = {
  hot: { color: '#f87171', bg: 'rgba(239,68,68,0.2)', label: 'Hot', icon: 'flame' },
  warm: { color: '#fbbf24', bg: 'rgba(245,158,11,0.2)', label: 'Warm', icon: 'sunny' },
  cold: { color: '#60a5fa', bg: 'rgba(96,165,250,0.2)', label: 'Cold', icon: 'snow' },
  rejected: { color: '#4ade80', bg: 'rgba(34,197,94,0.2)', label: 'Rented', icon: 'checkmark-circle' },
  needs_human: { color: '#fbbf24', bg: 'rgba(245,158,11,0.2)', label: 'Review', icon: 'alert-circle' },
};

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
      const [convs, detail] = await Promise.all([
        api.getConversations(),
        api.getConversation(id),
      ]);
      const conv = convs.find((c) => c._id === id) ?? null;
      setConversation(conv);
      setMessages(detail.messages);
    } catch (err) {
      console.error(err);
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
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    } catch (err: any) {
      Alert.alert('Error', err.message);
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#475569', marginTop: 12, fontSize: 14 }}>Loading conversation...</Text>
      </View>
    );
  }

  const score = SCORE_CONFIG[conversation?.leadScore ?? 'cold'];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Conversation Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
        <Animated.View entering={FadeInDown.springify()}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* Avatar */}
              <View style={{
                width: 42, height: 42, borderRadius: 13,
                backgroundColor: score.bg, alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: score.color, fontSize: 18, fontWeight: '700' }}>
                  {(conversation?.tenantName || conversation?.tenantPhone || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 16 }}>
                  {conversation?.tenantName || conversation?.tenantPhone || 'Unknown'}
                </Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>{conversation?.tenantPhone}</Text>
              </View>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: score.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
            }}>
              <Ionicons name={score.icon} size={13} color={score.color} />
              <Text style={{ color: score.color, fontSize: 12, fontWeight: '700' }}>{score.label}</Text>
            </View>
          </View>

          {conversation?.qualification?.moveInDate && (
            <View style={{ flexDirection: 'row', gap: 12, paddingLeft: 52 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calendar-outline" size={12} color="#475569" />
                <Text style={{ color: '#475569', fontSize: 12 }}>
                  {new Date(conversation.qualification.moveInDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              {conversation.qualification.occupants && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="people-outline" size={12} color="#475569" />
                  <Text style={{ color: '#475569', fontSize: 12 }}>{conversation.qualification.occupants} person(s)</Text>
                </View>
              )}
              {conversation.qualification.employed === true && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="briefcase-outline" size={12} color="#4ade80" />
                  <Text style={{ color: '#4ade80', fontSize: 12 }}>Employed</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg, i) => (
          <MessageBubble key={msg._id} msg={msg} index={i} />
        ))}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Bottom actions */}
      <View style={{ backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155', padding: 16 }}>
        {/* WhatsApp */}
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(34,197,94,0.12)', borderRadius: 14,
            paddingVertical: 12, alignItems: 'center', marginBottom: 12,
            borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
          }}
          onPress={() => Linking.openURL(`https://wa.me/${conversation?.tenantPhone?.replace('+', '')}`)}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#4ade80" />
          <Text style={{ color: '#4ade80', fontWeight: '600', fontSize: 14 }}>Open in WhatsApp</Text>
        </TouchableOpacity>

        {/* Reply input */}
        <View style={{
          flexDirection: 'row', gap: 10, marginBottom: 12,
          backgroundColor: inputFocused ? '#0f172a' : '#0f172a',
          borderRadius: 16, borderWidth: 1.5,
          borderColor: inputFocused ? '#3b82f6' : '#334155',
          paddingHorizontal: 14, paddingVertical: 4,
          alignItems: 'flex-end',
        }}>
          <TextInput
            style={{ flex: 1, color: '#f1f5f9', fontSize: 14, paddingVertical: 10, maxHeight: 100 }}
            placeholder="Reply as yourself..."
            placeholderTextColor="#475569"
            value={reply}
            onChangeText={setReply}
            multiline
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          <TouchableOpacity
            style={{
              backgroundColor: reply.trim() ? '#3b82f6' : '#334155',
              borderRadius: 10, padding: 8, marginBottom: 2,
            }}
            onPress={handleReply}
            disabled={sending || !reply.trim()}
          >
            {sending
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="send" size={14} color="white" />}
          </TouchableOpacity>
        </View>

        {/* Score actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ScoreButton label="🔥 Hot" color="#ef4444" bg="rgba(239,68,68,0.15)" border="rgba(239,68,68,0.3)" onPress={() => updateScore('hot')} />
          <ScoreButton label="✅ Rented" color="#4ade80" bg="rgba(34,197,94,0.15)" border="rgba(34,197,94,0.3)" onPress={() => updateScore('rejected')} />
          <ScoreButton label="❌ Reject" color="#64748b" bg="rgba(100,116,139,0.15)" border="rgba(100,116,139,0.3)" onPress={() => updateScore('cold')} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ msg, index }: { msg: Message; index: number }) {
  const isInbound = msg.direction === 'inbound';

  return (
    <Animated.View
      entering={isInbound ? FadeInLeft.delay(index * 40).springify() : FadeInRight.delay(index * 40).springify()}
      style={{
        marginBottom: 10,
        alignSelf: isInbound ? 'flex-start' : 'flex-end',
        maxWidth: '78%',
      }}
    >
      <View style={{
        borderRadius: 18,
        borderBottomLeftRadius: isInbound ? 4 : 18,
        borderBottomRightRadius: isInbound ? 18 : 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: isInbound ? '#1e293b' : '#2563eb',
        borderWidth: isInbound ? 1 : 0,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}>
        <Text style={{ color: isInbound ? '#e2e8f0' : 'white', fontSize: 14, lineHeight: 20 }}>
          {msg.content}
        </Text>
      </View>
      <Text style={{
        color: '#475569', fontSize: 11, marginTop: 4,
        marginLeft: isInbound ? 4 : 0,
        marginRight: isInbound ? 0 : 4,
        textAlign: isInbound ? 'left' : 'right',
      }}>
        {isInbound ? '👤 Tenant' : '🤖 Aidan (AI)'}
      </Text>
    </Animated.View>
  );
}

function ScoreButton({ label, color, bg, border, onPress }: {
  label: string; color: string; bg: string; border: string; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, { flex: 1 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          paddingVertical: 10, alignItems: 'center', borderRadius: 12,
          backgroundColor: bg, borderWidth: 1, borderColor: border,
        }}
      >
        <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
