import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { api } from '../../services/api';
import { PropertyConfig } from '@property-agent/types';
import { router } from 'expo-router';
import { supabase } from '../../services/api';

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
      Alert.alert('Saved', 'Property details updated successfully');
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
      Alert.alert('Sent!', 'Daily digest sent to your WhatsApp');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setTriggering(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Property Details */}
      <SectionHeader title="Property Details" />
      <View className="bg-white mx-4 rounded-xl overflow-hidden">
        <Field label="Property Name" value={property.name} onChangeText={(v) => setProperty({ ...property, name: v })} />
        <Field label="Address" value={property.address} onChangeText={(v) => setProperty({ ...property, address: v })} />
        <Field label="Bedrooms" value={String(property.bedrooms ?? '')} keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, bedrooms: Number(v) })} />
        <Field label="Bathrooms" value={String(property.bathrooms ?? '')} keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, bathrooms: Number(v) })} last />
      </View>

      {/* Pricing */}
      <SectionHeader title="Pricing (Private)" />
      <View className="bg-white mx-4 rounded-xl overflow-hidden">
        <Field label="Asking Rent (€)" value={String(property.askingRent ?? '')} keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, askingRent: Number(v) })} />
        <Field label="Min Rent (€) 🔒" value={String((property as any).minimumRent ?? '')} keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, ...(({ minimumRent: Number(v) }) as any) })} />
        <Field label="Deposit (€)" value={String(property.deposit ?? '')} keyboardType="numeric" onChangeText={(v) => setProperty({ ...property, deposit: Number(v) })} last />
      </View>

      {/* AI Agent */}
      <SectionHeader title="AI Agent" />
      <View className="bg-white mx-4 rounded-xl overflow-hidden">
        <Field label="Agent Name" value={property.agentName} onChangeText={(v) => setProperty({ ...property, agentName: v })} />
        <Field label="Your WhatsApp Number" value={property.ownerPhone} onChangeText={(v) => setProperty({ ...property, ownerPhone: v })} />
        <Field label="Digest Time" value={property.digestTime} onChangeText={(v) => setProperty({ ...property, digestTime: v })} last />
      </View>

      {/* Actions */}
      <View className="px-4 mt-6 gap-3 mb-10">
        <TouchableOpacity
          className="bg-blue-600 rounded-xl py-4 items-center"
          onPress={handleSave}
          disabled={saving}
        >
          <Text className="text-white font-semibold">{saving ? 'Saving...' : '💾 Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-green-50 border border-green-200 rounded-xl py-4 items-center"
          onPress={handleTriggerDigest}
          disabled={triggering}
        >
          <Text className="text-green-700 font-medium">{triggering ? 'Sending...' : '📊 Send Test Digest'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 rounded-xl py-4 items-center"
          onPress={() => router.push('/setup/photos')}
        >
          <Text className="text-gray-700 font-medium">📷 Manage Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="rounded-xl py-4 items-center"
          onPress={handleLogout}
        >
          <Text className="text-red-500 font-medium">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-5 pb-2">
      {title}
    </Text>
  );
}

function Field({
  label, value, onChangeText, keyboardType, last,
}: {
  label: string;
  value?: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center px-4 py-3 ${!last ? 'border-b border-gray-100' : ''}`}>
      <Text className="text-sm text-gray-500 w-36">{label}</Text>
      <TextInput
        className="flex-1 text-sm text-gray-900 text-right"
        value={value ?? ''}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        placeholder="—"
        placeholderTextColor="#9ca3af"
      />
    </View>
  );
}
