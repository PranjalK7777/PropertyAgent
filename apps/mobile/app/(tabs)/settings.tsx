import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PropertyConfig } from '@property-agent/types';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { api, supabase } from '../../services/api';
import { AppGradient, theme } from '../../components/ui/theme';

type PropertyDraft = Partial<PropertyConfig>;

export default function SettingsScreen() {
  const [property, setProperty] = useState<PropertyDraft>({});
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
      Alert.alert('Saved', 'Property details updated successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save changes.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTriggerDigest() {
    setTriggering(true);
    try {
      await api.triggerDigest();
      Alert.alert('Digest sent', 'Your daily digest was sent to WhatsApp.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send digest.';
      Alert.alert('Error', message);
    } finally {
      setTriggering(false);
    }
  }

  function updateField<K extends keyof PropertyConfig>(key: K, value: PropertyConfig[K]) {
    setProperty((current) => ({ ...current, [key]: value }));
  }

  return (
    <ScrollView className="flex-1 bg-canvas" contentContainerClassName="px-4 pb-10 pt-4">
      <Animated.View entering={FadeInDown.delay(40).springify()}>
        <View className="mb-6 rounded-3xl border border-line-soft bg-surface px-5 py-5 shadow-card">
          <Text className="text-xs font-bold uppercase tracking-wide text-muted">Property workspace</Text>
          <Text className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Tune your assistant setup.</Text>
          <Text className="mt-2 text-sm leading-6 text-muted">
            Keep your property details, automation settings, and owner contact information clean and up to date.
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).springify()}>
        <SectionHeader title="Status" icon="pulse-outline" />
        <View className="overflow-hidden rounded-3xl border border-line-soft bg-surface shadow-card">
          <ToggleField
            label="AI agent active"
            sublabel="Accept and respond to new WhatsApp enquiries."
            value={property.isActive ?? false}
            onToggle={(value) => updateField('isActive', value)}
          />
          <ToggleField
            label="Property rented"
            sublabel="Pause new leads once this listing is no longer available."
            value={property.isRented ?? false}
            onToggle={(value) => updateField('isRented', value)}
            last
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <SectionHeader title="Property details" icon="business-outline" />
        <View className="overflow-hidden rounded-3xl border border-line-soft bg-surface shadow-card">
          <Field label="Property name" icon="home-outline" value={property.name} onChangeText={(value) => updateField('name', value)} />
          <Field label="Address" icon="location-outline" value={property.address} onChangeText={(value) => updateField('address', value)} />
          <Field label="Bedrooms" icon="bed-outline" value={numberToText(property.bedrooms)} keyboardType="numeric" onChangeText={(value) => updateField('bedrooms', toNumber(value))} />
          <Field label="Bathrooms" icon="water-outline" value={numberToText(property.bathrooms)} keyboardType="numeric" onChangeText={(value) => updateField('bathrooms', toNumber(value))} />
          <Field label="Max occupants" icon="people-outline" value={numberToText(property.maxOccupants)} keyboardType="numeric" onChangeText={(value) => updateField('maxOccupants', toNumber(value))} />
          <Field label="Gender preference" icon="male-female-outline" value={property.genderPreference} onChangeText={(value) => updateField('genderPreference', value as PropertyConfig['genderPreference'])} last />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).springify()}>
        <SectionHeader title="Pricing" icon="cash-outline" />
        <View className="overflow-hidden rounded-3xl border border-line-soft bg-surface shadow-card">
          <Field label="Asking rent" icon="wallet-outline" value={numberToText(property.askingRent)} keyboardType="numeric" onChangeText={(value) => updateField('askingRent', toNumber(value))} />
          <Field label="Deposit" icon="shield-outline" value={numberToText(property.deposit)} keyboardType="numeric" onChangeText={(value) => updateField('deposit', toNumber(value))} />
          <Field label="Utilities" icon="flash-outline" value={numberToText(property.utilityCostMonthly)} keyboardType="numeric" onChangeText={(value) => updateField('utilityCostMonthly', toNumber(value))} />
          <Field label="Deposit policy" icon="document-text-outline" value={property.depositDeductionPolicy} onChangeText={(value) => updateField('depositDeductionPolicy', value)} last />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <SectionHeader title="AI assistant" icon="sparkles-outline" />
        <View className="overflow-hidden rounded-3xl border border-line-soft bg-surface shadow-card">
          <Field label="Agent name" icon="person-outline" value={property.agentName} onChangeText={(value) => updateField('agentName', value)} />
          <PhoneField label="Agent phone" icon="call-outline" value={property.agentPhone} onChangeText={(value) => updateField('agentPhone', value)} />
          <PhoneField label="Owner WhatsApp" icon="logo-whatsapp" value={property.ownerPhone} onChangeText={(value) => updateField('ownerPhone', value)} />
          <Field label="Digest time" icon="time-outline" value={property.digestTime} onChangeText={(value) => updateField('digestTime', value)} last />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).springify()} className="mt-7 gap-3">
        <PrimaryActionButton
          label={saving ? 'Saving changes...' : 'Save changes'}
          icon="save-outline"
          loading={saving}
          onPress={handleSave}
        />
        <SecondaryActionButton
          label={triggering ? 'Sending digest...' : 'Send test digest'}
          icon="send-outline"
          tone="sage"
          loading={triggering}
          onPress={handleTriggerDigest}
        />
        <SecondaryActionButton
          label="Manage photos"
          icon="images-outline"
          tone="brand"
          onPress={() => router.push('/setup/photos')}
        />
        <TouchableOpacity
          className="items-center rounded-2xl border border-red-200 bg-red-50 px-4 py-4"
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  await supabase.auth.signOut();
                  router.replace('/(auth)/login');
                },
              },
            ]);
          }}
        >
          <Text className="text-sm font-bold text-red-700">Sign out</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="mb-3 mt-5 flex-row items-center">
      <Ionicons name={icon} size={14} color={theme.colors.brandStrong} />
      <Text className="ml-2 text-xs font-bold uppercase tracking-wide text-muted">{title}</Text>
    </View>
  );
}

function ToggleField({
  label,
  sublabel,
  value,
  onToggle,
  last,
}: {
  label: string;
  sublabel: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center px-4 py-4 ${last ? '' : 'border-b border-line-soft'}`}>
      <View className="flex-1 pr-4">
        <Text className="text-sm font-semibold text-ink">{label}</Text>
        <Text className="mt-1 text-xs leading-5 text-muted">{sublabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.canvasAlt, true: theme.colors.brandSoft }}
        thumbColor={value ? theme.colors.brand : '#8a7b70'}
      />
    </View>
  );
}

function PhoneField({
  label,
  value,
  onChangeText,
  last,
  icon,
}: {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
  last?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const [focused, setFocused] = useState(false);

  // Split stored value into country code + local number.
  // Stored format is digits only, e.g. "919763319924" → cc="91", local="9763319924"
  // We attempt to detect a 1-3 digit country code prefix stored alongside the number.
  // We keep a local cc state separate from the main number so the user can edit them independently.
  const [cc, setCc] = useState<string>(() => {
    if (!value) return '91';
    // If the value is longer than 10 digits, assume the extra prefix is the country code.
    const digits = value.replace(/\D/g, '');
    if (digits.length > 10) return digits.slice(0, digits.length - 10);
    return '91';
  });
  const [localNumber, setLocalNumber] = useState<string>(() => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length > 10) return digits.slice(digits.length - 10);
    return digits;
  });

  function handleCcChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setCc(digits);
    onChangeText(digits + localNumber);
  }

  function handleLocalChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setLocalNumber(digits);
    onChangeText(cc + digits);
  }

  return (
    <View className={`px-4 py-4 ${last ? '' : 'border-b border-line-soft'}`}>
      <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{label}</Text>
      <View className="flex-row items-center rounded-2xl border bg-input px-3" style={{ borderColor: focused ? theme.colors.brand : theme.colors.lineBrand }}>
        <Ionicons name={icon} size={16} color={focused ? theme.colors.brandStrong : theme.colors.muted} />
        <Text className="ml-3 text-sm font-semibold text-muted">+</Text>
        <TextInput
          className="py-3 text-sm text-ink"
          style={{ width: 38 }}
          value={cc}
          onChangeText={handleCcChange}
          keyboardType="phone-pad"
          placeholder="91"
          placeholderTextColor="#a5978a"
          maxLength={3}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Text className="text-sm text-muted">|</Text>
        <TextInput
          className="ml-2 flex-1 py-3 text-right text-sm text-ink"
          value={localNumber}
          onChangeText={handleLocalChange}
          keyboardType="phone-pad"
          placeholder="9763319924"
          placeholderTextColor="#a5978a"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  last,
  icon,
}: {
  label: string;
  value?: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  last?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={`px-4 py-4 ${last ? '' : 'border-b border-line-soft'}`}>
      <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{label}</Text>
      <View className="flex-row items-center rounded-2xl border bg-input px-3" style={{ borderColor: focused ? theme.colors.brand : theme.colors.lineBrand }}>
        <Ionicons name={icon} size={16} color={focused ? theme.colors.brandStrong : theme.colors.muted} />
        <TextInput
          className="ml-3 flex-1 py-3 text-right text-sm text-ink"
          value={value ?? ''}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          placeholder="—"
          placeholderTextColor="#a5978a"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

function PrimaryActionButton({
  label,
  icon,
  loading,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

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
        disabled={loading}
      >
        <AppGradient
          colors={loading ? [theme.colors.brandStrong, theme.colors.brandStrong] : theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="min-h-14 flex-row items-center justify-center rounded-2xl shadow-cta"
        >
          {loading ? <ActivityIndicator color="#fff7f1" size="small" /> : <Ionicons name={icon} size={16} color="#fff7f1" />}
          <Text className="ml-2 text-base font-bold text-white">{label}</Text>
        </AppGradient>
      </Pressable>
    </Animated.View>
  );
}

function SecondaryActionButton({
  label,
  icon,
  tone,
  loading,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'brand' | 'sage';
  loading?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = tone === 'sage' ? theme.colors.sage : theme.colors.brandStrong;
  const borderColor = tone === 'sage' ? 'rgba(47, 93, 80, 0.18)' : theme.colors.lineBrand;
  const backgroundColor = tone === 'sage' ? 'rgba(47, 93, 80, 0.08)' : theme.colors.input;

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
        disabled={loading}
      >
        <View className="min-h-14 flex-row items-center justify-center rounded-2xl border px-4" style={{ borderColor, backgroundColor, opacity: loading ? 0.7 : 1 }}>
          {loading ? <ActivityIndicator color={color} size="small" /> : <Ionicons name={icon} size={16} color={color} />}
          <Text className="ml-2 text-base font-bold" style={{ color }}>{label}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function numberToText(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
