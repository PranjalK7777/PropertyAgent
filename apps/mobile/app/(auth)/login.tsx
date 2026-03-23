import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { cssInterop } from 'nativewind';
import * as Notifications from 'expo-notifications';
import { api, supabase } from '../../services/api';

const Gradient = cssInterop(LinearGradient, {
  className: 'style',
});

const BRAND = '#b85c38';
const BRAND_STRONG = '#8f3d20';
const SAGE = '#2f5d50';

export default function LoginScreen() {
  const { height } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isCompactHeight = height < 780;

  const heroTranslateY = useSharedValue(-24);
  const heroOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    heroTranslateY.value = withSpring(0, { damping: 15, stiffness: 110 });
    heroOpacity.value = withTiming(1, { duration: 700 });
  }, [heroOpacity, heroTranslateY]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  async function registerPushToken() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      const { data } = await Notifications.getExpoPushTokenAsync();
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      await api.registerPushToken(data, platform);
    } catch (error) {
      console.warn('Push token registration failed:', error);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    buttonScale.value = withSequence(withSpring(0.97), withSpring(1));
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      await registerPushToken();
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in right now';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  }

  const contentClassName = isCompactHeight
    ? 'flex-grow justify-center px-6 pt-7 pb-5'
    : 'flex-grow justify-center px-6 pt-14 pb-8';
  const heroClassName = isCompactHeight ? 'mb-5' : 'mb-7';
  const badgeClassName = isCompactHeight
    ? 'mb-3 self-start flex-row items-center rounded-full border border-sage/20 bg-surface/80 px-3 py-1.5'
    : 'mb-4 self-start flex-row items-center rounded-full border border-sage/20 bg-surface/80 px-3 py-2';
  const titleClassName = isCompactHeight
    ? 'max-w-xs text-3xl font-extrabold leading-9 tracking-tight text-ink'
    : 'max-w-sm text-4xl font-extrabold leading-10 tracking-tight text-ink';
  const subtitleClassName = isCompactHeight
    ? 'mt-2 max-w-xs text-sm leading-5 text-muted'
    : 'mt-3 max-w-sm text-base leading-6 text-muted';
  const pillRowClassName = isCompactHeight ? 'mt-3 flex-row flex-wrap gap-2' : 'mt-4 flex-row flex-wrap gap-2.5';
  const pillClassName = isCompactHeight
    ? 'flex-row items-center rounded-full border border-line-brand bg-surface/85 px-2.5 py-2'
    : 'flex-row items-center rounded-full border border-line-brand bg-surface/85 px-3 py-2.5';
  const cardClassName = isCompactHeight
    ? 'rounded-3xl border border-line-soft bg-surface px-4 py-4 shadow-card'
    : 'rounded-3xl border border-line-soft bg-surface px-5 py-5 shadow-card';
  const cardHeaderClassName = isCompactHeight ? 'mb-4' : 'mb-5';
  const cardSubtitleClassName = isCompactHeight ? 'mt-1.5 text-sm leading-5 text-muted' : 'mt-2 text-sm leading-6 text-muted';
  const fieldClassName = isCompactHeight ? 'mb-3' : 'mb-4';
  const inputShellClassName = isCompactHeight
    ? 'min-h-14 flex-row items-center rounded-2xl border border-line-brand bg-input px-3.5'
    : 'min-h-14 flex-row items-center rounded-2xl border border-line-brand bg-input px-3.5';
  const buttonWrapClassName = isCompactHeight ? 'mt-1' : 'mt-2';
  const buttonClassName = isCompactHeight
    ? 'min-h-14 flex-row items-center justify-center rounded-2xl shadow-cta'
    : 'min-h-14 flex-row items-center justify-center rounded-2xl shadow-cta';

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Gradient
        colors={['#f9f1e7', '#f3e5d7', '#ead8c6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <View className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-brand/15" />
        <View className="absolute bottom-24 -left-9 h-36 w-36 rounded-full bg-sage/10" />

        <ScrollView
          className="flex-1"
          contentContainerClassName={contentClassName}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={heroStyle}>
            <View className={heroClassName}>
              <View className={badgeClassName}>
                <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-sage/10">
                  <Ionicons name="business-outline" size={18} color={SAGE} />
                </View>
                <Text className="text-xs font-bold text-sage">Property Agent</Text>
              </View>

              <Text className={titleClassName}>
                A calmer, more premium start to your daily lead workflow.
              </Text>

              <Text className={subtitleClassName}>
                Sign in to review inquiries and keep every property conversation in one place.
              </Text>

              <View className={pillRowClassName}>
                <View className={pillClassName}>
                  <Ionicons name="sparkles-outline" size={14} color={BRAND_STRONG} />
                  <Text className="ml-2 text-xs font-semibold text-brand-strong">AI-assisted replies</Text>
                </View>
                <View className={pillClassName}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={BRAND_STRONG} />
                  <Text className="ml-2 text-xs font-semibold text-brand-strong">Secure sign in</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120).springify()}>
            <View className={cardClassName}>
              <View className={cardHeaderClassName}>
                <Text className="text-xs font-bold uppercase tracking-wide text-brand-strong">Welcome back</Text>
                <Text className="mt-2 text-2xl font-extrabold tracking-tight text-ink">Access your workspace</Text>
                <Text className={cardSubtitleClassName}>Use your account credentials to continue.</Text>
              </View>

              <Animated.View entering={FadeInDown.delay(180).springify()}>
                <View className={fieldClassName}>
                  <Text className="mb-2 text-xs font-bold text-ink">Email</Text>
                  <View className={inputShellClassName}>
                    <View className="mr-2.5 h-9 w-9 items-center justify-center rounded-full bg-brand-soft">
                      <Ionicons name="mail-outline" size={18} color={BRAND_STRONG} />
                    </View>
                    <TextInput
                      className="flex-1 py-4 text-base text-ink"
                      placeholder="name@company.com"
                      placeholderTextColor="#9d8d80"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="next"
                      textContentType="emailAddress"
                      importantForAutofill="yes"
                    />
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(240).springify()}>
                <View className={fieldClassName}>
                  <Text className="mb-2 text-xs font-bold text-ink">Password</Text>
                  <View className={inputShellClassName}>
                    <View className="mr-2.5 h-9 w-9 items-center justify-center rounded-full bg-brand-soft">
                      <Ionicons name="lock-closed-outline" size={18} color={BRAND_STRONG} />
                    </View>
                    <TextInput
                      className="flex-1 py-4 text-base text-ink"
                      placeholder="Enter your password"
                      placeholderTextColor="#9d8d80"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                      textContentType="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword((current) => !current)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#6f6257"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>

              <Animated.View style={buttonStyle}>
                <View className={buttonWrapClassName}>
                  <Pressable
                    onPress={handleLogin}
                    onPressIn={() => {
                      buttonScale.value = withSpring(0.98);
                    }}
                    onPressOut={() => {
                      buttonScale.value = withSpring(1);
                    }}
                    disabled={loading}
                  >
                    <Gradient
                      colors={loading ? [BRAND_STRONG, BRAND_STRONG] : [BRAND, '#a24b2d', BRAND_STRONG]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className={buttonClassName}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff7f1" />
                      ) : (
                        <>
                          <Text className="text-base font-bold text-white">Sign In</Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff7f1" style={{ marginLeft: 10 }} />
                        </>
                      )}
                    </Gradient>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
      </Gradient>
    </KeyboardAvoidingView>
  );
}
