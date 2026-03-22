import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  Alert, Platform, KeyboardAvoidingView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { supabase, api } from '../../services/api';
import * as Notifications from 'expo-notifications';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, withSequence, interpolate, Easing, FadeInDown, FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const btnScale = useSharedValue(1);
  const logoY = useSharedValue(-30);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoY.value = withSpring(0, { damping: 14, stiffness: 120 });
    logoOpacity.value = withTiming(1, { duration: 700 });
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoY.value }],
    opacity: logoOpacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  async function registerPushToken() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const { data } = await Notifications.getExpoPushTokenAsync();
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await api.registerPushToken(data, platform);
    } catch (err) {
      console.warn('Push token registration failed:', err);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    btnScale.value = withSequence(withSpring(0.96), withSpring(1));
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await registerPushToken();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>

          {/* Logo / Branding */}
          <Animated.View style={[logoStyle, { alignItems: 'center', marginBottom: 48 }]}>
            <View style={{
              width: 72, height: 72, borderRadius: 22, backgroundColor: '#3b82f6',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
            }}>
              <Ionicons name="home" size={36} color="white" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: 'white', letterSpacing: -0.5 }}>
              Property Agent
            </Text>
            <Text style={{ fontSize: 14, color: '#94a3b8', marginTop: 6, letterSpacing: 0.2 }}>
              Manage your flat inquiries with AI
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            {/* Email */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: emailFocused ? '#1e3a5f' : '#1e293b',
              borderRadius: 16, borderWidth: 1.5,
              borderColor: emailFocused ? '#3b82f6' : '#334155',
              paddingHorizontal: 16, marginBottom: 14,
              shadowColor: emailFocused ? '#3b82f6' : 'transparent',
              shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8,
            }}>
              <Ionicons name="mail-outline" size={18} color={emailFocused ? '#3b82f6' : '#64748b'} style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, color: 'white', paddingVertical: 16, fontSize: 15 }}
                placeholder="Email address"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: passFocused ? '#1e3a5f' : '#1e293b',
              borderRadius: 16, borderWidth: 1.5,
              borderColor: passFocused ? '#3b82f6' : '#334155',
              paddingHorizontal: 16, marginBottom: 28,
              shadowColor: passFocused ? '#3b82f6' : 'transparent',
              shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 8,
            }}>
              <Ionicons name="lock-closed-outline" size={18} color={passFocused ? '#3b82f6' : '#64748b'} style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, color: 'white', paddingVertical: 16, fontSize: 15 }}
                placeholder="Password"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <AnimatedPressable
              style={[btnStyle]}
              onPress={handleLogin}
              onPressIn={() => { btnScale.value = withSpring(0.97); }}
              onPressOut={() => { btnScale.value = withSpring(1); }}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#1d4ed8', '#1d4ed8'] : ['#3b82f6', '#2563eb', '#1d4ed8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16, paddingVertical: 17, alignItems: 'center',
                  shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4, shadowRadius: 14, elevation: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 }}>
                    Sign In
                  </Text>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(400)} style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ color: '#475569', fontSize: 12 }}>
              Powered by AI · Secure with Supabase
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
