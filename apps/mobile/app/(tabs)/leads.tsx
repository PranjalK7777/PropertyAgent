import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Conversation, LeadScore } from '@property-agent/types';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { api } from '../../services/api';
import { getLeadTone, theme } from '../../components/ui/theme';

const FILTERS: { label: string; value: LeadScore | 'all' | 'escalated'; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', value: 'all', icon: 'apps-outline' },
  { label: 'Hot', value: 'hot', icon: 'flame-outline' },
  { label: 'Warm', value: 'warm', icon: 'sunny-outline' },
  { label: 'Cold', value: 'cold', icon: 'snow-outline' },
  { label: 'Escalated', value: 'escalated', icon: 'warning-outline' },
];

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
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View className="flex-1 bg-canvas">
      <View className="border-b border-line-soft bg-canvas px-4 pb-4 pt-3">
        <Text className="text-xs font-bold uppercase tracking-wide text-muted">Lead pipeline</Text>
        <Text className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Every conversation, clearer.</Text>
        <Text className="mt-2 text-sm leading-6 text-muted">
          Filter tenants quickly and jump into the conversations that need action first.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerClassName="gap-2"
        >
          {FILTERS.map((item, index) => (
            <FilterChip
              key={item.value}
              item={item}
              active={filter === item.value}
              onPress={() => setFilter(item.value)}
              delay={index * 40}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            tintColor={theme.colors.brand}
            colors={[theme.colors.brand]}
          />
        }
      >
        {conversations.length === 0 && !refreshing ? (
          <Animated.View entering={FadeInDown.springify()}>
            <View className="items-center rounded-3xl border border-line-soft bg-surface px-6 py-16 shadow-card">
              <View className="h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft">
                <Ionicons name="people-outline" size={32} color={theme.colors.brandStrong} />
              </View>
              <Text className="mt-5 text-lg font-bold text-ink">No leads found</Text>
              <Text className="mt-2 text-center text-sm leading-6 text-muted">Try a different filter or wait for new inquiries to arrive.</Text>
            </View>
          </Animated.View>
        ) : (
          conversations.map((conversation, index) => (
            <ConversationCard key={conversation._id} conversation={conversation} index={index} />
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}

function FilterChip({
  item,
  active,
  onPress,
  delay,
}: {
  item: (typeof FILTERS)[number];
  active: boolean;
  onPress: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);
  const tone = item.value === 'escalated' ? getLeadTone('cold', true) : getLeadTone(item.value === 'all' ? 'warm' : item.value);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(delay)} style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.95);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={onPress}
      >
        <View
          className="flex-row items-center rounded-full border px-4 py-2.5"
          style={{
            backgroundColor: active ? tone.soft : theme.colors.surface,
            borderColor: active ? tone.border : theme.colors.lineBrand,
          }}
        >
          <Ionicons name={item.icon} size={14} color={active ? tone.color : theme.colors.muted} />
          <Text className="ml-2 text-sm font-semibold" style={{ color: active ? tone.color : theme.colors.muted }}>
            {item.label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ConversationCard({ conversation, index }: { conversation: Conversation; index: number }) {
  const scale = useSharedValue(1);
  const tone = getLeadTone(conversation.leadScore, conversation.needsHumanReview);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const metadata = [
    {
      icon: 'time-outline' as const,
      label: new Date(conversation.lastMessageAt).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' }),
    },
    conversation.qualification?.moveInDate
      ? {
          icon: 'calendar-outline' as const,
          label: new Date(conversation.qualification.moveInDate).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' }),
        }
      : null,
    conversation.qualification?.occupants
      ? {
          icon: 'people-outline' as const,
          label: `${conversation.qualification.occupants} people`,
        }
      : null,
  ].filter(
    (item): item is { icon: 'time-outline' | 'calendar-outline' | 'people-outline'; label: string } => Boolean(item),
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={[animatedStyle, { marginBottom: 12 }]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={() => router.push(`/conversation/${conversation._id}`)}
      >
        <View className="rounded-3xl border border-line-soft bg-surface px-4 py-4 shadow-card">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: tone.soft }}>
                <Text className="text-base font-extrabold" style={{ color: tone.color }}>
                  {(conversation.tenantName || conversation.tenantPhone || '?')[0].toUpperCase()}
                </Text>
              </View>

              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-ink">{conversation.tenantName || conversation.tenantPhone || 'Unknown'}</Text>
                <Text className="mt-1 text-sm text-muted">{conversation.tenantPhone}</Text>
              </View>
            </View>

            <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: tone.soft }}>
              <Text className="text-xs font-bold" style={{ color: tone.color }}>
                {tone.label}
              </Text>
            </View>
          </View>

          {metadata.length > 0 ? (
            <View className="mt-4 flex-row flex-wrap gap-3">
              {metadata.map((item) => (
                <View key={`${item.icon}-${item.label}`} className="flex-row items-center rounded-full bg-input px-3 py-1.5">
                  <Ionicons name={item.icon} size={12} color={theme.colors.muted} />
                  <Text className="ml-1.5 text-xs font-medium text-muted">{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {conversation.humanReviewReason ? (
            <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
              <Text className="text-sm leading-6 text-amber-800">{conversation.humanReviewReason}</Text>
            </View>
          ) : null}

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-muted">{conversation.messageCount} messages exchanged</Text>
            <View className="flex-row items-center">
              <Text className="mr-1 text-sm font-semibold text-brand-strong">Open</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.brandStrong} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
