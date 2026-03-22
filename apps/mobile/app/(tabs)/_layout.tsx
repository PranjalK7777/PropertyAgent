import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: '#0f172a',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          borderBottomColor: '#1e293b',
          borderBottomWidth: 1,
        },
        headerTintColor: '#f1f5f9',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: '#f1f5f9',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? 'rgba(59,130,246,0.15)' : 'transparent',
              borderRadius: 10, padding: 4,
            }}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? 'rgba(59,130,246,0.15)' : 'transparent',
              borderRadius: 10, padding: 4,
            }}>
              <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="digest"
        options={{
          title: 'Digest',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? 'rgba(59,130,246,0.15)' : 'transparent',
              borderRadius: 10, padding: 4,
            }}>
              <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: focused ? 'rgba(59,130,246,0.15)' : 'transparent',
              borderRadius: 10, padding: 4,
            }}>
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
