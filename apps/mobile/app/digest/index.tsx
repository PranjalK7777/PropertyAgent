import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { DailyDigest } from '@property-agent/types';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function DigestHistoryScreen() {
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Digest History',
        headerBackTitle: 'Settings',
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f1f5f9',
        headerTitleStyle: { fontWeight: '700', color: '#f1f5f9' },
      }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0f172a' }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#3b82f6" colors={['#3b82f6']} />}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 }}>
          <TriggerButton triggering={triggering} onPress={handleTrigger} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(100)} style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {digests.length} digest{digests.length !== 1 ? 's' : ''} sent
          </Text>
        </Animated.View>

        {digests.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="bar-chart-outline" size={36} color="#334155" />
            </View>
            <Text style={{ color: '#475569', fontSize: 16, fontWeight: '600' }}>No digests yet</Text>
            <Text style={{ color: '#334155', fontSize: 13, marginTop: 4 }}>Daily digest sends at 9pm IST</Text>
          </Animated.View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            {digests.map((digest, i) => (
              <DigestCard
                key={digest._id}
                digest={digest}
                index={i}
                isExpanded={expandedId === digest._id}
                onToggle={() => setExpandedId(expandedId === digest._id ? null : digest._id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function TriggerButton({ triggering, onPress }: { triggering: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={triggering}
      >
        <LinearGradient
          colors={triggering ? ['#15803d', '#15803d'] : ['#16a34a', '#15803d']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
            opacity: triggering ? 0.75 : 1,
          }}
        >
          {triggering ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={16} color="white" />}
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
            {triggering ? 'Sending Digest...' : 'Send Digest Now'}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function DigestCard({ digest, index, isExpanded, onToggle }: {
  digest: DailyDigest; index: number; isExpanded: boolean; onToggle: () => void;
}) {
  const scale = useSharedValue(1);
  const chevronRotate = useSharedValue(isExpanded ? 180 : 0);

  useEffect(() => {
    chevronRotate.value = withSpring(isExpanded ? 180 : 0, { damping: 14 });
  }, [isExpanded]);

  const chevronStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${chevronRotate.value}deg` }] }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const date = new Date(digest.generatedAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = new Date(digest.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).springify()} style={[pressStyle, { marginBottom: 12 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.99); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onToggle}
        style={{ backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bar-chart" size={20} color="#3b82f6" />
            </View>
            <View>
              <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 15 }}>{date}</Text>
              <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{time}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
              <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: '700' }}>{digest.stats.totalConversations} chats</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
              <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '700' }}>{digest.stats.hotLeads} hot</Text>
            </View>
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-down" size={16} color="#475569" />
            </Animated.View>
          </View>
        </View>

        {isExpanded && (
          <Animated.View entering={FadeInDown.springify()} style={{ borderTopWidth: 1, borderTopColor: '#334155', padding: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              {[
                { value: digest.stats.totalConversations, label: 'Total Chats', icon: 'chatbubbles', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                { value: digest.stats.newToday, label: 'New Today', icon: 'person-add', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
                { value: digest.stats.hotLeads, label: 'Hot Leads', icon: 'flame', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                { value: digest.stats.escalations, label: 'Escalations', icon: 'alert-circle', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
              ].map(({ value, label, icon, color, bg }) => (
                <View key={label} style={{ flex: 1, minWidth: '44%', backgroundColor: bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: `${color}30` }}>
                  <Ionicons name={icon as any} size={16} color={color} />
                  <Text style={{ color: '#f1f5f9', fontSize: 24, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 }}>{value}</Text>
                  <Text style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{label}</Text>
                </View>
              ))}
            </View>

            {digest.summary && (
              <View style={{ backgroundColor: '#0f172a', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="sparkles" size={12} color="#a78bfa" />
                  <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>AI Summary</Text>
                </View>
                <Text style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 20 }}>{digest.summary}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={digest.sentToWhatsApp ? 'checkmark-circle' : 'close-circle'} size={14} color={digest.sentToWhatsApp ? '#4ade80' : '#f87171'} />
              <Text style={{ color: digest.sentToWhatsApp ? '#4ade80' : '#f87171', fontSize: 12, fontWeight: '500' }}>
                {digest.sentToWhatsApp ? 'Delivered via WhatsApp' : 'WhatsApp delivery failed'}
              </Text>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}
