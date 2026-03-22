import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Pressable, ActivityIndicator, Switch } from 'react-native';
import { api } from '../../services/api';
import { PropertyConfig } from '@property-agent/types';
import { router } from 'expo-router';
import { supabase } from '../../services/api';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [property, setProperty] = useState<Partial<PropertyConfig>>({});
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    api.getProperty().then(setProperty).catch(console.error);
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.updateProperty(property);
      setProperty(updated);
      Alert.alert('✅ Saved', 'Property details updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTriggerDigest() {
    setTriggering(true);
    try {
      await api.triggerDigest();
      Alert.alert('📊 Sent!', 'Daily digest sent to your WhatsApp');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setTriggering(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>

      {/* Status */}
      <Animated.View entering={FadeInDown.delay(50).springify()}>
        <SectionHeader title="Status" icon="power" />
        <View style={{ marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' }}>
          <ToggleField
            label="AI Agent Active"
            sublabel="Accept & reply to WhatsApp enquiries"
            value={property.isActive ?? false}
            onToggle={(v) => setProperty({ ...property, isActive: v })}
          />
          <ToggleField
            label="Property Rented"
            sublabel="Stop accepting new enquiries"
            value={(property as any).isRented ?? false}
            onToggle={(v) => setProperty({ ...property, ...(({ isRented: v }) as any) })}
            last
          />
        </View>
      </Animated.View>

      {/* Property Details */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <SectionHeader title="Property Details" icon="home" />
        <View style={{ marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' }}>
          <Field label="Property Name" value={property.name} icon="business-outline" onChangeText={(v) => setProperty({ ...property, name: v })} />
          <Field label="Address" value={property.address} icon="location-outline" onChangeText={(v) => setProperty({ ...property, address: v })} />
          <Field label="Bedrooms" value={String(property.bedrooms ?? '')} icon="bed-outline" keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, bedrooms: Number(v) })} />
          <Field label="Bathrooms" value={String(property.bathrooms ?? '')} icon="water-outline" keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, bathrooms: Number(v) })} last />
        </View>
      </Animated.View>

      {/* Pricing */}
      <Animated.View entering={FadeInDown.delay(150).springify()}>
        <SectionHeader title="Pricing (Private)" icon="lock-closed" />
        <View style={{ marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' }}>
          <Field label="Asking Rent (€)" value={String(property.askingRent ?? '')} icon="cash-outline" keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, askingRent: Number(v) })} />
          <Field label="Min Rent (€)" value={String((property as any).minimumRent ?? '')} icon="trending-down-outline" keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, ...(({ minimumRent: Number(v) }) as any) })} />
          <Field label="Deposit (€)" value={String(property.deposit ?? '')} icon="shield-outline" keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, deposit: Number(v) })} last />
        </View>
      </Animated.View>

      {/* AI Agent */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <SectionHeader title="AI Agent" icon="sparkles" />
        <View style={{ marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' }}>
          <Field label="Agent Name" value={property.agentName} icon="person-outline" onChangeText={(v) => setProperty({ ...property, agentName: v })} />
          <Field label="Agent Phone" value={(property as any).agentPhone} icon="call-outline" onChangeText={(v) => setProperty({ ...property, ...(({ agentPhone: v }) as any) })} />
          <Field label="Your WhatsApp" value={property.ownerPhone} icon="logo-whatsapp" onChangeText={(v) => setProperty({ ...property, ownerPhone: v })} />
          <Field label="Digest Time" value={property.digestTime} icon="time-outline" onChangeText={(v) => setProperty({ ...property, digestTime: v })} last />
        </View>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(250).springify()} style={{ paddingHorizontal: 16, marginTop: 28, gap: 12, marginBottom: 40 }}>
        {/* Save */}
        <ActionButton
          label={saving ? 'Saving...' : 'Save Changes'}
          icon="save-outline"
          gradient={['#1d4ed8', '#3b82f6']}
          glowColor="#3b82f6"
          loading={saving}
          onPress={handleSave}
        />

        {/* Test Digest */}
        <ActionButton
          label={triggering ? 'Sending...' : 'Send Test Digest'}
          icon="send-outline"
          gradient={['#15803d', '#22c55e']}
          glowColor="#22c55e"
          loading={triggering}
          onPress={handleTriggerDigest}
        />

        {/* Photos */}
        <ActionButton
          label="Manage Photos"
          icon="images-outline"
          gradient={['#7c3aed', '#a78bfa']}
          glowColor="#a78bfa"
          onPress={() => router.push('/setup/photos')}
        />

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            paddingVertical: 16, alignItems: 'center', borderRadius: 16,
            borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
          }}
        >
          <Text style={{ color: '#f87171', fontWeight: '600', fontSize: 15 }}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

function ActionButton({ label, icon, gradient, glowColor, loading, onPress }: {
  label: string; icon: any; gradient: [string, string]; glowColor: string;
  loading?: boolean; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={loading}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: glowColor, shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <Ionicons name={icon} size={16} color="white" />}
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function ToggleField({ label, sublabel, value, onToggle, last }: {
  label: string; sublabel: string; value: boolean;
  onToggle: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View style={[
      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
      !last ? { borderBottomWidth: 1, borderBottomColor: '#334155' } : {},
    ]}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{sublabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#334155', true: '#1d4ed8' }}
        thumbColor={value ? '#3b82f6' : '#64748b'}
      />
    </View>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 }}>
      <Ionicons name={icon} size={13} color="#3b82f6" />
      <Text style={{
        color: '#64748b', fontSize: 11, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 1,
      }}>
        {title}
      </Text>
    </View>
  );
}

function Field({
  label, value, onChangeText, keyboardType, last, icon,
}: {
  label: string;
  value?: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  last?: boolean;
  icon?: any;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[
      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
      !last ? { borderBottomWidth: 1, borderBottomColor: '#334155' } : {},
      focused ? { backgroundColor: 'rgba(59,130,246,0.05)' } : {},
    ]}>
      <View style={{ width: 28 }}>
        {icon && <Ionicons name={icon} size={15} color={focused ? '#3b82f6' : '#475569'} />}
      </View>
      <Text style={{ color: '#94a3b8', fontSize: 14, flex: 1 }}>{label}</Text>
      <TextInput
        style={{ color: '#f1f5f9', fontSize: 14, textAlign: 'right', minWidth: 120 }}
        value={value ?? ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        placeholder="—"
        placeholderTextColor="#334155"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}
