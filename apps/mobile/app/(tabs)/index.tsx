import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Linking, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { api } from '../../services/api';
import { Conversation, TodayStats } from '@property-agent/types';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeInDown, FadeInRight, ZoomIn, interpolate, Easing,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={loadData}
          tintColor="#3b82f6"
          colors={['#3b82f6']}
        />
      }
    >
      {/* Header Banner */}
      <LinearGradient
        colors={['#1e3a5f', '#0f172a']}
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Text style={{ color: '#94a3b8', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: '600' }}>
            {today}
          </Text>
          <Text style={{ color: '#f1f5f9', fontSize: 26, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 }}>
            Good day 👋
          </Text>
          <Text style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
            Here's what's happening with your property
          </Text>
        </Animated.View>
      </LinearGradient>

      {/* Stats Row */}
      {stats && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: -10 }}>
          <StatCard label="Total" value={stats.total} icon="chatbubbles" color={['#1e40af', '#3b82f6']} delay={100} />
          <StatCard label="Hot Leads" value={stats.hot} icon="flame" color={['#991b1b', '#ef4444']} delay={200} />
          <StatCard label="Needs You" value={stats.escalations} icon="alert-circle" color={['#92400e', '#f59e0b']} delay={300} />
        </View>
      )}

      {/* Escalations */}
      {escalations.length > 0 && (
        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionTitle icon="warning" iconColor="#f59e0b" title="Needs Your Attention" count={escalations.length} />
          {escalations.map((lead, i) => (
            <LeadCard key={lead._id} lead={lead} index={i} />
          ))}
        </Animated.View>
      )}

      {/* Hot leads */}
      {hotLeads.length > 0 && (
        <Animated.View entering={FadeInDown.delay(250).springify()} style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <SectionTitle icon="flame" iconColor="#ef4444" title="Hot Leads" count={hotLeads.length} />
          {hotLeads.map((lead, i) => (
            <LeadCard key={lead._id} lead={lead} index={i} />
          ))}
        </Animated.View>
      )}

      {!stats && !refreshing && (
        <Animated.View entering={FadeInDown.delay(100)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <Ionicons name="moon-outline" size={48} color="#334155" />
          <Text style={{ color: '#475569', marginTop: 12, fontSize: 16, fontWeight: '600' }}>No activity yet today</Text>
          <Text style={{ color: '#334155', marginTop: 4, fontSize: 13 }}>Pull to refresh</Text>
        </Animated.View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function SectionTitle({ icon, iconColor, title, count }: { icon: any; iconColor: string; title: string; count: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Ionicons name={icon} size={16} color={iconColor} />
      <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 15, marginLeft: 6 }}>{title}</Text>
      <View style={{
        backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8,
      }}>
        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600' }}>{count}</Text>
      </View>
    </View>
  );
}

function StatCard({ label, value, icon, color, delay }: {
  label: string; value: number; icon: any; color: [string, string]; delay: number;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 150 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animStyle, { flex: 1 }]}>
      <LinearGradient
        colors={color}
        style={{
          borderRadius: 16, padding: 14, alignItems: 'flex-start',
          shadowColor: color[1], shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
        }}
      >
        <Ionicons name={icon} size={18} color="rgba(255,255,255,0.8)" />
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '800', marginTop: 8, letterSpacing: -1 }}>{value}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2, fontWeight: '600' }}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function LeadCard({ lead, index }: { lead: Conversation; index: number }) {
  const scale = useSharedValue(1);
  const isEscalated = lead.needsHumanReview;

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).springify()}
      style={[pressStyle, { marginBottom: 12 }]}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push(`/conversation/${lead._id}`)}
        style={{
          backgroundColor: '#1e293b',
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: isEscalated ? '#78350f' : '#1e3a5f',
        }}
      >
        {/* Top accent line */}
        <View style={{
          height: 3,
          backgroundColor: isEscalated ? '#f59e0b' : '#ef4444',
        }} />

        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 15 }}>
              {lead.tenantName || lead.tenantPhone}
            </Text>
            <View style={{
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
              backgroundColor: isEscalated ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
            }}>
              <Text style={{
                fontSize: 11, fontWeight: '700',
                color: isEscalated ? '#fbbf24' : '#f87171',
              }}>
                {isEscalated ? '⚠️ Escalated' : '🔥 Hot'}
              </Text>
            </View>
          </View>

          <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>{lead.tenantPhone}</Text>

          {lead.humanReviewReason && (
            <View style={{
              backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, marginTop: 4,
              borderLeftWidth: 3, borderLeftColor: '#f59e0b',
            }}>
              <Text style={{ color: '#fcd34d', fontSize: 12, lineHeight: 18 }}>{lead.humanReviewReason}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1, backgroundColor: 'rgba(59,130,246,0.15)',
                borderRadius: 12, paddingVertical: 10, alignItems: 'center',
                borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
                flexDirection: 'row', justifyContent: 'center', gap: 6,
              }}
              onPress={() => router.push(`/conversation/${lead._id}`)}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#60a5fa" />
              <Text style={{ color: '#60a5fa', fontSize: 13, fontWeight: '600' }}>Open Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1, backgroundColor: 'rgba(34,197,94,0.15)',
                borderRadius: 12, paddingVertical: 10, alignItems: 'center',
                borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
                flexDirection: 'row', justifyContent: 'center', gap: 6,
              }}
              onPress={() => Linking.openURL(`https://wa.me/${lead.tenantPhone.replace('+', '')}`)}
            >
              <Ionicons name="logo-whatsapp" size={14} color="#4ade80" />
              <Text style={{ color: '#4ade80', fontSize: 13, fontWeight: '600' }}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
