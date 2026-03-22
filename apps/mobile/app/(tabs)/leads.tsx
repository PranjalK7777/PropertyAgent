import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { Conversation, LeadScore } from '@property-agent/types';

const FILTERS: { label: string; value: LeadScore | 'all' | 'escalated' }[] = [
  { label: 'All', value: 'all' },
  { label: '🔥 Hot', value: 'hot' },
  { label: '🟡 Warm', value: 'warm' },
  { label: '❄️ Cold', value: 'cold' },
  { label: '⚠️ Escalated', value: 'escalated' },
];

const SCORE_BADGE: Record<string, string> = {
  hot: '🔥 Hot',
  warm: '🟡 Warm',
  cold: '❄️ Cold',
  rejected: '❌ Rejected',
  needs_human: '🤔 Review',
};

export default function LeadsScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState<'all' | LeadScore | 'escalated'>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    setRefreshing(true);
    try {
      const params: Parameters<typeof api.getConversations>[0] = {};
      if (filter === 'escalated') params.needsHumanReview = true;
      else if (filter !== 'all') params.leadScore = filter;
      setConversations(await api.getConversations(params));
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-100 py-3 px-4 flex-grow-0">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            className={`mr-3 px-4 py-1.5 rounded-full ${filter === f.value ? 'bg-blue-600' : 'bg-gray-100'}`}
            onPress={() => setFilter(f.value)}
          >
            <Text className={`text-sm font-medium ${filter === f.value ? 'text-white' : 'text-gray-600'}`}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        <View className="px-4 py-3">
          {conversations.length === 0 && !refreshing && (
            <Text className="text-gray-400 text-center py-10">No leads found</Text>
          )}
          {conversations.map((conv) => (
            <TouchableOpacity
              key={conv._id}
              className="bg-white rounded-xl p-4 mb-3 border border-gray-100"
              onPress={() => router.push(`/conversation/${conv._id}`)}
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text className="font-semibold text-gray-900">{conv.tenantName || 'Unknown'}</Text>
                <Text className="text-sm text-gray-400">{SCORE_BADGE[conv.leadScore] ?? conv.leadScore}</Text>
              </View>
              <Text className="text-sm text-gray-500">{conv.tenantPhone}</Text>
              <Text className="text-xs text-gray-400 mt-1">
                {new Date(conv.lastMessageAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                {conv.qualification?.moveInDate &&
                  ` · Moving ${new Date(conv.qualification.moveInDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}`}
                {conv.qualification?.occupants && ` · ${conv.qualification.occupants} person(s)`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
