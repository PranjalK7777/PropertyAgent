import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { api } from '../../services/api';
import { Conversation, TodayStats } from '@property-agent/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function TodayScreen() {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [hotLeads, setHotLeads] = useState<Conversation[]>([]);
  const [escalations, setEscalations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();

    // Handle push notification taps → navigate to conversation
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const { conversationId } = response.notification.request.content.data as any;
      if (conversationId) router.push(`/conversation/${conversationId}`);
    });
    return () => sub.remove();
  }, []);

  async function loadData() {
    setRefreshing(true);
    try {
      const [statsData, hotData, escalationData] = await Promise.all([
        api.getTodayStats(),
        api.getConversations({ leadScore: 'hot' }),
        api.getConversations({ needsHumanReview: true }),
      ]);
      setStats(statsData);
      setHotLeads(hotData);
      setEscalations(escalationData);
    } catch (err) {
      console.error('Failed to load today data:', err);
    } finally {
      setRefreshing(false);
    }
  }

  const today = new Date().toLocaleDateString('en-IE', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
    >
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">{today}</Text>
      </View>

      {/* Stats */}
      {stats && (
        <View className="flex-row gap-3 px-4 py-4">
          <StatCard label="Total" value={stats.total} color="bg-gray-100" />
          <StatCard label="🔥 Hot" value={stats.hot} color="bg-red-50" />
          <StatCard label="⚠️ Needs You" value={stats.escalations} color="bg-amber-50" />
        </View>
      )}

      {/* Escalations */}
      {escalations.length > 0 && (
        <View className="px-4 mb-4">
          <Text className="text-base font-semibold text-amber-600 mb-2">⚠️ Needs Your Attention</Text>
          {escalations.map((lead) => (
            <LeadCard key={lead._id} lead={lead} />
          ))}
        </View>
      )}

      {/* Hot leads */}
      {hotLeads.length > 0 && (
        <View className="px-4 mb-4">
          <Text className="text-base font-semibold text-red-500 mb-2">🔥 Hot Leads</Text>
          {hotLeads.map((lead) => (
            <LeadCard key={lead._id} lead={lead} />
          ))}
        </View>
      )}

      {!stats && !refreshing && (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-gray-400">No activity yet today</Text>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className={`flex-1 rounded-xl p-3 items-center ${color}`}>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500 mt-1">{label}</Text>
    </View>
  );
}

function LeadCard({ lead }: { lead: Conversation }) {
  const scoreColor = lead.needsHumanReview
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700';

  return (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-1">
        <Text className="font-semibold text-gray-900">{lead.tenantName || lead.tenantPhone}</Text>
        <View className={`px-2 py-0.5 rounded-full ${scoreColor}`}>
          <Text className="text-xs font-medium">
            {lead.needsHumanReview ? '⚠️ Escalated' : '🔥 Hot'}
          </Text>
        </View>
      </View>
      {lead.humanReviewReason && (
        <Text className="text-sm text-amber-600 mb-2">{lead.humanReviewReason}</Text>
      )}
      <View className="flex-row gap-2 mt-2">
        <TouchableOpacity
          className="flex-1 bg-blue-50 rounded-lg py-2 items-center"
          onPress={() => router.push(`/conversation/${lead._id}`)}
        >
          <Text className="text-blue-600 text-sm font-medium">Open Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-green-50 rounded-lg py-2 items-center"
          onPress={() => Linking.openURL(`https://wa.me/${lead.tenantPhone.replace('+', '')}`)}
        >
          <Text className="text-green-600 text-sm font-medium">WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
