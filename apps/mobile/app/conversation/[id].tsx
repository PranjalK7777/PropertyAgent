import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../services/api';
import { Conversation, Message } from '@property-agent/types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const scoreLabel = {
    hot: '🔥 Hot', warm: '🟡 Warm', cold: '❄️ Cold', rejected: '❌ Rejected', needs_human: '⚠️ Review',
  }[conversation?.leadScore ?? 'cold'];

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-gray-900">
            {conversation?.tenantName || conversation?.tenantPhone || 'Unknown'}
          </Text>
          <Text>{scoreLabel}</Text>
        </View>
        <Text className="text-sm text-gray-500">{conversation?.tenantPhone}</Text>
        {conversation?.qualification?.moveInDate && (
          <Text className="text-xs text-gray-400 mt-0.5">
            Moving {new Date(conversation.qualification.moveInDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}
            {conversation.qualification.occupants ? ` · ${conversation.qualification.occupants} person(s)` : ''}
            {conversation.qualification.employed === true ? ' · Employed ✅' : ''}
          </Text>
        )}
      </View>

      {/* Messages */}
      <ScrollView className="flex-1 px-4 py-3">
        {messages.map((msg) => (
          <View
            key={msg._id}
            className={`mb-3 max-w-xs ${msg.direction === 'inbound' ? 'self-start' : 'self-end ml-auto'}`}
          >
            <View
              className={`rounded-2xl px-4 py-2 ${
                msg.direction === 'inbound' ? 'bg-gray-100' : 'bg-blue-600'
              }`}
            >
              <Text className={msg.direction === 'inbound' ? 'text-gray-900' : 'text-white'}>
                {msg.content}
              </Text>
            </View>
            <Text className="text-xs text-gray-400 mt-1 px-1">
              {msg.direction === 'inbound' ? 'Tenant' : 'Aidan (AI)'}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Actions */}
      <View className="border-t border-gray-100 px-4 py-3">
        {/* Open in WhatsApp */}
        <TouchableOpacity
          className="bg-green-50 rounded-xl py-3 items-center mb-3"
          onPress={() => Linking.openURL(`https://wa.me/${conversation?.tenantPhone?.replace('+', '')}`)}
        >
          <Text className="text-green-700 font-medium">📱 Open in WhatsApp</Text>
        </TouchableOpacity>

        {/* Manual reply */}
        <View className="flex-row gap-2 mb-3">
          <TextInput
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm"
            placeholder="Reply as yourself..."
            value={reply}
            onChangeText={setReply}
            multiline
          />
          <TouchableOpacity
            className="bg-blue-600 rounded-xl px-4 items-center justify-center"
            onPress={handleReply}
            disabled={sending}
          >
            <Text className="text-white font-medium">{sending ? '...' : 'Send'}</Text>
          </TouchableOpacity>
        </View>

        {/* Lead actions */}
        <View className="flex-row gap-2">
          <TouchableOpacity className="flex-1 bg-red-50 rounded-lg py-2 items-center" onPress={() => updateScore('hot')}>
            <Text className="text-red-600 text-sm">🔥 Hot</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-green-50 rounded-lg py-2 items-center" onPress={() => updateScore('rejected')}>
            <Text className="text-green-700 text-sm">✅ Rented</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-gray-100 rounded-lg py-2 items-center" onPress={() => updateScore('cold')}>
            <Text className="text-gray-500 text-sm">❌ Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
