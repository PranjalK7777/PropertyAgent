import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DailyDigest } from '@property-agent/types';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { api } from '../../services/api';
import { AppGradient, theme } from '../ui/theme';

type DigestMetric = {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  soft: string;
  border: string;
};

const metricPalette = {
  total: { color: theme.colors.brandStrong, soft: 'rgba(241, 214, 197, 0.75)', border: 'rgba(184, 92, 56, 0.2)' },
  hot: { color: theme.colors.danger, soft: 'rgba(254, 226, 226, 0.88)', border: 'rgba(248, 113, 113, 0.28)' },
  warm: { color: theme.colors.warning, soft: 'rgba(254, 243, 199, 0.88)', border: 'rgba(245, 158, 11, 0.28)' },
  escalation: { color: '#92400e', soft: 'rgba(255, 237, 213, 0.88)', border: 'rgba(251, 146, 60, 0.28)' },
  viewing: { color: theme.colors.info, soft: 'rgba(224, 242, 254, 0.88)', border: 'rgba(56, 189, 248, 0.28)' },
};

export function DigestFeed() {
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleTrigger() {
    setTriggering(true);
    try {
      await api.triggerDigest();
      await load();
    } catch (error) {
      console.error(error);
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <ActivityIndicator size="large" color={theme.colors.brand} />
        <Text className="mt-3 text-sm font-medium text-muted">Loading digests...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerClassName="px-4 pb-8 pt-5"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={theme.colors.brand}
          colors={[theme.colors.brand]}
        />
      }
    >
      <Animated.View entering={FadeInDown.delay(40).springify()}>
        <TriggerButton triggering={triggering} onPress={handleTrigger} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(80)}>
        <Text className="mb-3 mt-4 text-xs font-bold uppercase tracking-wide text-muted">
          {digests.length} digest{digests.length !== 1 ? 's' : ''} sent
        </Text>
      </Animated.View>

      {digests.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(120)}>
          <View className="items-center rounded-3xl border border-line-soft bg-surface px-6 py-14 shadow-card">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft">
              <Ionicons name="bar-chart-outline" size={34} color={theme.colors.brandStrong} />
            </View>
            <Text className="mt-5 text-lg font-bold text-ink">No digests yet</Text>
            <Text className="mt-2 text-center text-sm leading-6 text-muted">
              Your daily digest history will appear here once reports have been sent.
            </Text>
          </View>
        </Animated.View>
      ) : (
        digests.map((digest, index) => (
          <DigestCard
            key={digest._id}
            digest={digest}
            index={index}
            isExpanded={expandedId === digest._id}
            onToggle={() => setExpandedId(expandedId === digest._id ? null : digest._id)}
          />
        ))
      )}
    </ScrollView>
  );
}

function TriggerButton({ triggering, onPress }: { triggering: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
        disabled={triggering}
      >
        <AppGradient
          colors={triggering ? [theme.colors.brandStrong, theme.colors.brandStrong] : theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="min-h-14 flex-row items-center justify-center rounded-2xl shadow-cta"
        >
          {triggering ? (
            <ActivityIndicator color="#fff7f1" size="small" />
          ) : (
            <Ionicons name="send-outline" size={16} color="#fff7f1" />
          )}
          <Text className="ml-2 text-base font-bold text-white">
            {triggering ? 'Sending digest...' : 'Send digest now'}
          </Text>
        </AppGradient>
      </Pressable>
    </Animated.View>
  );
}

function DigestCard({
  digest,
  index,
  isExpanded,
  onToggle,
}: {
  digest: DailyDigest;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);
  const chevronRotate = useSharedValue(isExpanded ? 180 : 0);

  useEffect(() => {
    chevronRotate.value = withSpring(isExpanded ? 180 : 0, { damping: 14 });
  }, [isExpanded, chevronRotate]);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotate.value}deg` }],
  }));

  const createdLabel = new Date(digest.createdAt || digest.sentAt).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const timeLabel = new Date(digest.sentAt || digest.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const metrics: DigestMetric[] = [
    {
      label: 'Total inquiries',
      value: digest.stats.totalInquiries,
      icon: 'chatbubbles-outline',
      ...metricPalette.total,
    },
    {
      label: 'Hot leads',
      value: digest.stats.hotLeads,
      icon: 'flame-outline',
      ...metricPalette.hot,
    },
    {
      label: 'Warm leads',
      value: digest.stats.warmLeads,
      icon: 'sunny-outline',
      ...metricPalette.warm,
    },
    {
      label: 'Escalations',
      value: digest.stats.escalations,
      icon: 'alert-circle-outline',
      ...metricPalette.escalation,
    },
    {
      label: 'Viewing requests',
      value: digest.stats.viewingRequests,
      icon: 'calendar-outline',
      ...metricPalette.viewing,
    },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()} style={[pressStyle, { marginBottom: 12 }]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.99);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onToggle}
      >
        <View className="overflow-hidden rounded-3xl border border-line-soft bg-surface shadow-card">
          <View className="flex-row items-center justify-between px-4 py-4">
            <View className="flex-1 flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft">
                <Ionicons name="bar-chart-outline" size={20} color={theme.colors.brandStrong} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-ink">{createdLabel}</Text>
                <Text className="mt-1 text-xs text-muted">Sent at {timeLabel}</Text>
              </View>
            </View>

            <View className="ml-3 flex-row items-center">
              <View className="rounded-full bg-brand-soft px-3 py-1.5">
                <Text className="text-xs font-bold text-brand-strong">{digest.stats.totalInquiries} chats</Text>
              </View>
              <Animated.View style={[chevronStyle, { marginLeft: 10 }]}>
                <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
              </Animated.View>
            </View>
          </View>

          {isExpanded && (
            <Animated.View entering={FadeInDown.springify()}>
              <View className="border-t border-line-soft px-4 py-4">
                <View className="mb-4 flex-row flex-wrap justify-between">
                  {metrics.map((metric) => (
                    <View
                      key={metric.label}
                      className="mb-3 rounded-2xl border px-3 py-3"
                      style={{ backgroundColor: metric.soft, borderColor: metric.border, width: '48%' }}
                    >
                      <Ionicons name={metric.icon} size={16} color={metric.color} />
                      <Text className="mt-2 text-2xl font-extrabold text-ink">{metric.value}</Text>
                      <Text className="mt-1 text-xs font-medium text-muted">{metric.label}</Text>
                    </View>
                  ))}
                </View>

                <View className="rounded-2xl border border-line-soft bg-input px-4 py-4">
                  <View className="mb-2 flex-row items-center">
                    <Ionicons name="sparkles-outline" size={14} color={theme.colors.sage} />
                    <Text className="ml-2 text-xs font-bold uppercase tracking-wide text-sage">AI summary</Text>
                  </View>
                  <Text className="text-sm leading-6 text-ink">{digest.aiSummaryText}</Text>
                </View>

                <View className="mt-4 rounded-2xl bg-canvas px-4 py-3">
                  <View className="flex-row items-center">
                    <Ionicons name="logo-whatsapp" size={14} color={theme.colors.sage} />
                    <Text className="ml-2 text-sm font-semibold text-ink">Sent to {digest.sentToPhone}</Text>
                  </View>
                  <Text className="mt-1 text-xs leading-5 text-muted">Message ID: {digest.waMessageId || 'Pending delivery confirmation'}</Text>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
