import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Platform, Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { api } from '../../services/api';
import { PropertyConfig } from '@property-agent/types';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInDown, ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function PhotosScreen() {
  const [property, setProperty] = useState<Partial<PropertyConfig>>({});
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    api.getProperty().then(setProperty).catch(console.error);
  }, []);

  async function handlePickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const updated = await api.uploadPhoto(
        asset.uri,
        asset.fileName ?? `photo-${Date.now()}.jpg`,
        asset.mimeType ?? 'image/jpeg',
        `Photo ${(property.photos?.length ?? 0) + 1}`,
        property.photos?.length ?? 0,
      );
      setProperty(updated);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(key: string) {
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeletingKey(key);
          try {
            const updated = await api.deletePhoto(key);
            setProperty(updated);
          } catch (err: any) {
            Alert.alert('Error', err.message);
          } finally {
            setDeletingKey(null);
          }
        },
      },
    ]);
  }

  const photos = property.photos ?? [];

  return (
    <>
      <Stack.Screen options={{
        title: 'Property Photos',
        headerBackTitle: 'Settings',
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f1f5f9',
        headerTitleStyle: { fontWeight: '700', color: '#f1f5f9' },
      }} />
      <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        {/* Upload button */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 }}>
          <UploadButton uploading={uploading} onPress={handlePickPhoto} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100)} style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={{ color: '#475569', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </Text>
        </Animated.View>

        {photos.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Ionicons name="images-outline" size={36} color="#334155" />
            </View>
            <Text style={{ color: '#475569', fontSize: 16, fontWeight: '600' }}>No photos yet</Text>
            <Text style={{ color: '#334155', fontSize: 13, marginTop: 4 }}>Add photos to show tenants your property</Text>
          </Animated.View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            {photos.map((photo, idx) => (
              <Animated.View
                key={photo.key}
                entering={FadeInDown.delay(idx * 80).springify()}
                style={{
                  backgroundColor: '#1e293b', borderRadius: 18, overflow: 'hidden',
                  marginBottom: 14, borderWidth: 1, borderColor: '#334155',
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3, shadowRadius: 10,
                }}
              >
                <Image source={{ uri: photo.url }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
                {/* Gradient overlay on image */}
                <View style={{ position: 'absolute', bottom: 52, left: 0, right: 0, height: 60, backgroundColor: 'transparent' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
                  <View>
                    <Text style={{ color: '#f1f5f9', fontWeight: '700', fontSize: 15 }}>{photo.label}</Text>
                    <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Photo {idx + 1}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(photo.key)}
                    disabled={deletingKey === photo.key}
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10,
                      padding: 10, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
                    }}
                  >
                    {deletingKey === photo.key
                      ? <ActivityIndicator size="small" color="#ef4444" />
                      : <Ionicons name="trash-outline" size={18} color="#ef4444" />}
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

function UploadButton({ uploading, onPress }: { uploading: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        disabled={uploading}
      >
        <LinearGradient
          colors={uploading ? ['#1d4ed8', '#1d4ed8'] : ['#2563eb', '#3b82f6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16, paddingVertical: 16, alignItems: 'center',
            flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
            opacity: uploading ? 0.75 : 1,
          }}
        >
          {uploading ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="cloud-upload" size={18} color="white" />}
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
            {uploading ? 'Uploading...' : 'Add Photo'}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
