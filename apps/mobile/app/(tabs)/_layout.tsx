import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { theme } from '../../components/ui/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.lineBrand,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          shadowColor: theme.colors.brand,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: theme.colors.canvas,
          borderBottomColor: theme.colors.lineBrand,
          borderBottomWidth: 1,
          shadowColor: theme.colors.brand,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 6,
        },
        headerTintColor: theme.colors.ink,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.colors.ink,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? theme.colors.brandSoft : 'transparent',
                borderRadius: 10,
                padding: 4,
              }}
            >
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
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? theme.colors.brandSoft : 'transparent',
                borderRadius: 10,
                padding: 4,
              }}
            >
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
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? theme.colors.brandSoft : 'transparent',
                borderRadius: 10,
                padding: 4,
              }}
            >
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
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? theme.colors.brandSoft : 'transparent',
                borderRadius: 10,
                padding: 4,
              }}
            >
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
