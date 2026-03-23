import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { PropertyConfig, PropertyImage } from '@property-agent/types';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { api } from '../../services/api';
import { AppGradient, theme } from '../../components/ui/theme';

type PropertyDraft = Partial<PropertyConfig> & { images?: PropertyImage[] };

export default function PhotosScreen() {
  const [property, setProperty] = useState<PropertyDraft>({});
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
      const images = property.images ?? [];
      const updated = await api.uploadPhoto(
        asset.uri,
        asset.fileName ?? `photo-${Date.now()}.jpg`,
        asset.mimeType ?? 'image/jpeg',
        `Photo ${images.length + 1}`,
        images.length,
      );
      setProperty(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      Alert.alert('Upload failed', message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(key: string) {
    Alert.alert('Delete photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingKey(key);
          try {
            const updated = await api.deletePhoto(key);
            setProperty(updated);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to delete photo.';
            Alert.alert('Error', message);
          } finally {
            setDeletingKey(null);
          }
        },
      },
    ]);
  }

  const images = property.images ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Property Photos',
          headerBackTitle: 'Settings',
          headerStyle: { backgroundColor: theme.colors.canvas },
          headerTintColor: theme.colors.ink,
          headerTitleStyle: { fontWeight: '700', color: theme.colors.ink },
        }}
      />
      <ScrollView className="flex-1 bg-canvas" contentContainerClassName="px-4 pb-8 pt-5">
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <UploadButton uploading={uploading} onPress={handlePickPhoto} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80)}>
          <Text className="mb-3 mt-4 text-xs font-bold uppercase tracking-wide text-muted">
            {images.length} photo{images.length !== 1 ? 's' : ''}
          </Text>
        </Animated.View>

        {images.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(120)}>
            <View className="items-center rounded-3xl border border-line-soft bg-surface px-6 py-16 shadow-card">
              <View className="h-20 w-20 items-center justify-center rounded-3xl bg-brand-soft">
                <Ionicons name="images-outline" size={34} color={theme.colors.brandStrong} />
              </View>
              <Text className="mt-5 text-lg font-bold text-ink">No photos yet</Text>
              <Text className="mt-2 text-center text-sm leading-6 text-muted">
                Add a few strong visuals so tenants get a better feel for the property before they message you.
              </Text>
            </View>
          </Animated.View>
        ) : (
          images.map((photo, index) => (
            <Animated.View key={photo.key} entering={FadeInDown.delay(index * 70).springify()} className="mb-4">
              <View className="overflow-hidden rounded-3xl border border-line-soft bg-surface shadow-card">
                <Image source={{ uri: photo.url }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
                <View className="flex-row items-center justify-between px-4 py-4">
                  <View>
                    <Text className="text-base font-bold text-ink">{photo.label}</Text>
                    <Text className="mt-1 text-sm text-muted">Photo {index + 1}</Text>
                  </View>

                  <TouchableOpacity
                    className="rounded-2xl border border-red-200 bg-red-50 p-3"
                    onPress={() => handleDelete(photo.key)}
                    disabled={deletingKey == photo.key}
                  >
                    {deletingKey === photo.key ? (
                      <ActivityIndicator size="small" color={theme.colors.danger} />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </>
  );
}

function UploadButton({ uploading, onPress }: { uploading: boolean; onPress: () => void }) {
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
        disabled={uploading}
      >
        <AppGradient
          colors={uploading ? [theme.colors.brandStrong, theme.colors.brandStrong] : theme.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="min-h-14 flex-row items-center justify-center rounded-2xl shadow-cta"
        >
          {uploading ? <ActivityIndicator color="#fff7f1" size="small" /> : <Ionicons name="cloud-upload-outline" size={18} color="#fff7f1" />}
          <Text className="ml-2 text-base font-bold text-white">{uploading ? 'Uploading...' : 'Add photo'}</Text>
        </AppGradient>
      </Pressable>
    </Animated.View>
  );
}
