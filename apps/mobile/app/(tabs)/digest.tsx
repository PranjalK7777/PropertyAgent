import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { DailyDigest } from '@property-agent/types';

export default function DigestScreen() {
  const [digests, setDigests] = useState<DailyDigest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await api.getDigests();
      setDigests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleTrigger() {
    setTriggering(true);
    try {
      await api.triggerDigest();
      await load();
    } catch (err: any) {
      console.error(err);
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      {/* Trigger button */}
      <View className="px-4 pt-5 pb-3">
        <TouchableOpacity
          className={`flex-row items-center justify-center gap-2 bg-green-600 rounded-xl py-4 ${triggering ? 'opacity-60' : ''}`}
          onPress={handleTrigger}
          disabled={triggering}
        >
          {triggering
            ? <ActivityIndicator color="white" />
            : <Ionicons name="send-outline" size={18} color="white" />}
          <Text className="text-white font-semibold text-base">
            {triggering ? 'Sending...' : 'Send Digest Now'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text className="text-xs text-gray-400 uppercase tracking-wider font-semibold px-4 pb-2">
        {digests.length} digest{digests.length !== 1 ? 's' : ''} sent
      </Text>

      {digests.length === 0 ? (
        <View className="items-center justify-center py-16">
          <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-400 mt-3 text-base">No digests yet</Text>
          <Text className="text-gray-300 text-sm mt-1">Daily digest sends at 9pm IST</Text>
        </View>
      ) : (
        <View className="px-4 gap-3 pb-10">
          {digests.map((digest) => {
            const isExpanded = expandedId === digest._id;
            const date = new Date(digest.generatedAt).toLocaleDateString('en-IN', {
              weekday: 'short', day: 'numeric', month: 'short',
            });
            const time = new Date(digest.generatedAt).toLocaleTimeString('en-IN', {
              hour: '2-digit', minute: '2-digit',
            });

            return (
              <TouchableOpacity
                key={digest._id}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
                onPress={() => setExpandedId(isExpanded ? null : digest._id)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between px-4 py-4">
                  <View>
                    <Text className="font-semibold text-gray-900">{date}</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">{time}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="bg-blue-50 px-2 py-1 rounded-md">
                      <Text className="text-xs font-bold text-blue-700">{digest.stats.totalConversations} chats</Text>
                    </View>
                    <View className="bg-red-50 px-2 py-1 rounded-md">
                      <Text className="text-xs font-bold text-red-700">{digest.stats.hotLeads} hot</Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
                  </View>
                </View>

                {isExpanded && (
                  <View className="border-t border-gray-100 px-4 py-4">
                    <View className="flex-row flex-wrap gap-3 mb-4">
                      {[
                        { value: digest.stats.totalConversations, label: 'Total Chats', icon: 'chatbubbles-outline' },
                        { value: digest.stats.newToday, label: 'New Today', icon: 'person-add-outline' },
                        { value: digest.stats.hotLeads, label: 'Hot Leads', icon: 'flame-outline' },
                        { value: digest.stats.escalations, label: 'Escalations', icon: 'alert-circle-outline' },
                      ].map(({ value, label, icon }) => (
                        <View key={label} className="flex-1 min-w-[40%] bg-gray-50 rounded-lg p-3">
                          <Ionicons name={icon as any} size={18} color="#6b7280" />
                          <Text className="text-2xl font-bold text-gray-900 mt-1">{value}</Text>
                          <Text className="text-xs text-gray-500">{label}</Text>
                        </View>
                      ))}
                    </View>

                    {digest.summary && (
                      <View className="bg-gray-50 rounded-lg p-3">
                        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Summary</Text>
                        <Text className="text-sm text-gray-700 leading-5">{digest.summary}</Text>
                      </View>
                    )}

                    <View className="flex-row items-center gap-1 mt-3">
                      <Ionicons
                        name={digest.sentToWhatsApp ? 'checkmark-circle' : 'close-circle'}
                        size={14}
                        color={digest.sentToWhatsApp ? '#16a34a' : '#dc2626'}
                      />
                      <Text className={`text-xs ${digest.sentToWhatsApp ? 'text-green-600' : 'text-red-500'}`}>
                        {digest.sentToWhatsApp ? 'Delivered via WhatsApp' : 'WhatsApp delivery failed'}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

