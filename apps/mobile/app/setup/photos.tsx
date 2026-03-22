import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { api } from '../../services/api';
import { PropertyConfig } from '@property-agent/types';

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
      <Stack.Screen options={{ title: 'Property Photos', headerBackTitle: 'Settings' }} />
      <ScrollView className="flex-1 bg-gray-50">
        {/* Upload button */}
        <View className="px-4 pt-5 pb-3">
          <TouchableOpacity
            className={`flex-row items-center justify-center gap-2 bg-blue-600 rounded-xl py-4 ${uploading ? 'opacity-60' : ''}`}
            onPress={handlePickPhoto}
            disabled={uploading}
          >
            {uploading
              ? <ActivityIndicator color="white" />
              : <Ionicons name="cloud-upload-outline" size={20} color="white" />}
            <Text className="text-white font-semibold text-base">
              {uploading ? 'Uploading...' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photo count */}
        <Text className="text-xs text-gray-400 uppercase tracking-wider font-semibold px-4 pb-2">
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </Text>

        {/* Photos grid */}
        {photos.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="images-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-3 text-base">No photos yet</Text>
            <Text className="text-gray-300 text-sm mt-1">Add photos to show tenants your property</Text>
          </View>
        ) : (
          <View className="px-4 gap-3 pb-10">
            {photos.map((photo, idx) => (
              <View key={photo.key} className="bg-white rounded-xl overflow-hidden shadow-sm">
                <Image
                  source={{ uri: photo.url }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
                <View className="flex-row items-center justify-between px-4 py-3">
                  <View>
                    <Text className="font-medium text-gray-900">{photo.label}</Text>
                    <Text className="text-xs text-gray-400">Photo {idx + 1}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(photo.key)}
                    disabled={deletingKey === photo.key}
                    className="p-2"
                  >
                    {deletingKey === photo.key
                      ? <ActivityIndicator size="small" color="#ef4444" />
                      : <Ionicons name="trash-outline" size={20} color="#ef4444" />}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
