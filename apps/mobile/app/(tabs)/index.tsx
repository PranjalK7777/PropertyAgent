import { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import type { Conversation, TodayStats } from '@property-agent/types';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { api } from '../../services/api';
import { AppGradient, getLeadTone, theme } from '../../components/ui/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STAT_CARDS = [
  {
    key: 'total',
    label: 'Active chats',
    icon: 'chatbubbles-outline' as const,
    tone: { color: theme.colors.brandStrong, soft: 'rgba(241, 214, 197, 0.78)' },
  },
  {
    key: 'hot',
    label: 'Hot leads',
    icon: 'flame-outline' as const,
    tone: { color: theme.colors.danger, soft: 'rgba(254, 226, 226, 0.88)' },
  },
  {
    key: 'escalations',
    label: 'Needs you',
    icon: 'alert-circle-outline' as const,
    tone: { color: theme.colors.warning, soft: 'rgba(255, 237, 213, 0.88)' },
  },
  {
    key: 'viewingRequests',
    label: 'Viewings',
    icon: 'calendar-outline' as const,
    tone: { color: theme.colors.info, soft: 'rgba(224, 242, 254, 0.88)' },
  },
] as const;

export default function TodayScreen() {
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [hotLeads, setHotLeads] = useState<Conversation[]>([]);
  const [escalations, setEscalations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const { conversationId } = response.notification.request.content.data as { conversationId?: string };
      if (conversationId) {
        router.push(`/conversation/${conversationId}`);
      }
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
    } catch (error) {
      console.error('Failed to load today data:', error);
    } finally {
      setRefreshing(false);
    }
  }

  const today = new Date().toLocaleDateString('en-IE', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={loadData}
          tintColor={theme.colors.brand}
          colors={[theme.colors.brand]}
        />
      }
    >
      <AppGradient colors={theme.gradients.page} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="px-5 pb-8 pt-5">
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <Text className="text-xs font-bold uppercase tracking-wide text-muted">{today}</Text>
          <Text className="mt-2 text-4xl font-extrabold tracking-tight text-ink">Today at a glance</Text>
          <Text className="mt-2 max-w-sm text-sm leading-6 text-muted">
            Stay on top of fresh inquiries, hot prospects, and any conversations that need your attention.
          </Text>
        </Animated.View>
      </AppGradient>

      {stats && (
        <View className="-mt-3 flex-row flex-wrap justify-between px-4">
          {STAT_CARDS.map((card, index) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={stats[card.key]}
              icon={card.icon}
              tone={card.tone}
              delay={index * 80}
            />
          ))}
        </View>
      )}

      {escalations.length > 0 && (
        <Animated.View entering={FadeInDown.delay(120).springify()} className="px-4 pt-6">
          <SectionTitle icon="warning-outline" title="Needs your attention" count={escalations.length} accent={theme.colors.warning} />
          {escalations.map((lead, index) => (
            <LeadCard key={lead._id} lead={lead} index={index} />
          ))}
        </Animated.View>
      )}

      {hotLeads.length > 0 && (
        <Animated.View entering={FadeInDown.delay(180).springify()} className="px-4 pt-6">
          <SectionTitle icon="flame-outline" title="Hot leads" count={hotLeads.length} accent={theme.colors.danger} />
          {hotLeads.map((lead, index) => (
            <LeadCard key={lead._id} lead={lead} index={index} />
          ))}
        </Animated.View>
      )}

      {!stats && !refreshing && (
        <Animated.View entering={FadeIn.delay(100)} className="items-center px-6 py-24">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft">
            <Ionicons name="moon-outline" size={34} color={theme.colors.brandStrong} />
          </View>
          <Text className="mt-5 text-lg font-bold text-ink">No activity yet today</Text>
          <Text className="mt-2 text-center text-sm leading-6 text-muted">Pull down to refresh once new tenant messages come in.</Text>
        </Animated.View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}

function SectionTitle({
  icon,
  title,
  count,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  accent: string;
}) {
  return (
    <View className="mb-3 flex-row items-center">
      <Ionicons name={icon} size={16} color={accent} />
      <Text className="ml-2 text-base font-bold text-ink">{title}</Text>
      <View className="ml-2 rounded-full bg-input px-3 py-1">
        <Text className="text-xs font-bold text-muted">{count}</Text>
      </View>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
  delay,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tone: { color: string; soft: string };
  delay: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 150 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, { width: '48%', marginBottom: 10 }]}>
      <View className="rounded-3xl border border-line-soft bg-surface px-4 py-4 shadow-card" style={{ backgroundColor: tone.soft }}>
        <Ionicons name={icon} size={18} color={tone.color} />
        <Text className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{value}</Text>
        <Text className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</Text>
      </View>
    </Animated.View>
  );
}

function LeadCard({ lead, index }: { lead: Conversation; index: number }) {
  const scale = useSharedValue(1);
  const tone = getLeadTone(lead.leadScore, lead.needsHumanReview);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()} style={[animatedStyle, { marginBottom: 12 }]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={() => router.push(`/conversation/${lead._id}`)}
      >
        <View className="overflow-hidden rounded-3xl border border-line-soft bg-surface shadow-card">
          <View style={{ height: 4, backgroundColor: tone.color }} />
          <View className="px-4 py-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: tone.soft }}>
                  <Text style={{ color: tone.color }} className="text-base font-extrabold">
                    {(lead.tenantName || lead.tenantPhone || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-ink">{lead.tenantName || lead.tenantPhone}</Text>
                  <Text className="mt-1 text-sm text-muted">{lead.tenantPhone}</Text>
                </View>
              </View>

              <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: tone.soft }}>
                <Text style={{ color: tone.color }} className="text-xs font-bold">
                  {tone.label}
                </Text>
              </View>
            </View>

            {lead.humanReviewReason ? (
              <View className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
                <Text className="text-sm leading-6 text-amber-800">{lead.humanReviewReason}</Text>
              </View>
            ) : null}

            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center rounded-2xl border border-line-brand bg-input px-3 py-3"
                onPress={() => router.push(`/conversation/${lead._id}`)}
              >
                <Ionicons name="chatbubble-outline" size={14} color={theme.colors.brandStrong} />
                <Text className="ml-2 text-sm font-semibold text-brand-strong">Open chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center rounded-2xl px-3 py-3"
                style={{ backgroundColor: 'rgba(47, 93, 80, 0.1)', borderWidth: 1, borderColor: 'rgba(47, 93, 80, 0.18)' }}
                onPress={() => Linking.openURL(`https://wa.me/${lead.tenantPhone.replace('+', '')}`)}
              >
                <Ionicons name="logo-whatsapp" size={14} color={theme.colors.sage} />
                <Text className="ml-2 text-sm font-semibold text-sage">WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
