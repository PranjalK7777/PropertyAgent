import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Pressable } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../services/api';
import { Conversation, LeadScore } from '@property-agent/types';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const FILTERS: { label: string; value: LeadScore | 'all' | 'escalated'; icon: any; color: string }[] = [
  { label: 'All', value: 'all', icon: 'apps-outline', color: '#94a3b8' },
  { label: 'Hot', value: 'hot', icon: 'flame', color: '#ef4444' },
  { label: 'Warm', value: 'warm', icon: 'sunny', color: '#f59e0b' },
  { label: 'Cold', value: 'cold', icon: 'snow', color: '#60a5fa' },
  { label: 'Escalated', value: 'escalated', icon: 'alert-circle', color: '#f59e0b' },
];

const SCORE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  hot: { label: 'Hot', color: '#f87171', bg: 'rgba(239,68,68,0.15)', icon: 'flame' },
  warm: { label: 'Warm', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', icon: 'sunny' },
  cold: { label: 'Cold', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', icon: 'snow' },
  rejected: { label: 'Rented', color: '#4ade80', bg: 'rgba(34,197,94,0.15)', icon: 'checkmark-circle' },
  needs_human: { label: 'Review', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', icon: 'alert-circle' },
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
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Filter chips */}
      <View style={{ backgroundColor: '#0f172a', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {FILTERS.map((f, i) => (
            <FilterChip
              key={f.value}
              filter={f}
              active={filter === f.value}
              onPress={() => setFilter(f.value)}
              delay={i * 50}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      >
        <View style={{ padding: 16 }}>
          {conversations.length === 0 && !refreshing && (
            <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Ionicons name="people-outline" size={52} color="#334155" />
              <Text style={{ color: '#475569', marginTop: 12, fontSize: 16, fontWeight: '600' }}>No leads found</Text>
              <Text style={{ color: '#334155', marginTop: 4, fontSize: 13 }}>Try a different filter</Text>
            </Animated.View>
          )}
          {conversations.map((conv, i) => (
            <ConversationCard key={conv._id} conv={conv} index={i} />
          ))}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function FilterChip({ filter, active, onPress, delay }: {
  filter: typeof FILTERS[0]; active: boolean; onPress: () => void; delay: number;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeIn.delay(delay)} style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
          backgroundColor: active ? filter.color : '#1e293b',
          borderWidth: 1,
          borderColor: active ? filter.color : '#334155',
          shadowColor: active ? filter.color : 'transparent',
          shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6,
        }}
      >
        <Ionicons
          name={filter.icon}
          size={13}
          color={active ? 'white' : filter.color}
        />
        <Text style={{
          fontSize: 13, fontWeight: '600',
          color: active ? 'white' : '#94a3b8',
        }}>
          {filter.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function ConversationCard({ conv, index }: { conv: Conversation; index: number }) {
  const scale = useSharedValue(1);
  const score = SCORE_CONFIG[conv.leadScore] ?? SCORE_CONFIG.cold;
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const timeStr = new Date(conv.lastMessageAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={[pressStyle, { marginBottom: 10 }]}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push(`/conversation/${conv._id}`)}
        style={{
          backgroundColor: '#1e293b',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: '#334155',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            {/* Avatar */}
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: score.bg, alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: score.color }}>
                {(conv.tenantName || conv.tenantPhone || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 15 }}>
                {conv.tenantName || 'Unknown'}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 12, marginTop: 1 }}>{conv.tenantPhone}</Text>
            </View>
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: score.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
          }}>
            <Ionicons name={score.icon} size={12} color={score.color} />
            <Text style={{ color: score.color, fontSize: 11, fontWeight: '700' }}>{score.label}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={12} color="#475569" />
            <Text style={{ color: '#475569', fontSize: 12 }}>{timeStr}</Text>
          </View>
          {conv.qualification?.moveInDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="calendar-outline" size={12} color="#475569" />
              <Text style={{ color: '#475569', fontSize: 12 }}>
                {new Date(conv.qualification.moveInDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          )}
          {conv.qualification?.occupants && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="person-outline" size={12} color="#475569" />
              <Text style={{ color: '#475569', fontSize: 12 }}>{conv.qualification.occupants}p</Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        <View style={{ position: 'absolute', right: 16, top: '50%' }}>
          <Ionicons name="chevron-forward" size={16} color="#334155" />
        </View>
      </Pressable>
    </Animated.View>
  );
}
