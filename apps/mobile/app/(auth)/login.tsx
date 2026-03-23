import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
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
import * as Notifications from 'expo-notifications';
import { api, supabase } from '../../services/api';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const palette = {
  backgroundTop: '#f9f1e7',
  backgroundBottom: '#ead8c6',
  ink: '#1f1a17',
  mutedText: '#6f6257',
  softLine: 'rgba(72, 56, 45, 0.16)',
  card: 'rgba(255, 251, 246, 0.94)',
  cardShadow: 'rgba(90, 62, 36, 0.18)',
  accent: '#b85c38',
  accentDeep: '#8f3d20',
  accentSoft: '#f1d6c5',
  inputSurface: '#f7efe6',
  chip: '#2f5d50',
  chipSoft: 'rgba(47, 93, 80, 0.12)',
};

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[palette.backgroundTop, '#f3e5d7', palette.backgroundBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.backgroundOrbOne} />
        <View style={styles.backgroundOrbTwo} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isCompactHeight && styles.scrollContentCompact,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={[styles.heroSection, isCompactHeight && styles.heroSectionCompact, heroStyle]}>
            <View style={[styles.heroBadge, isCompactHeight && styles.heroBadgeCompact]}>
              <View style={styles.heroBadgeIcon}>
                <Ionicons name="business-outline" size={18} color={palette.chip} />
              </View>
              <Text style={styles.heroBadgeText}>Property Agent</Text>
            </View>

            <Text style={[styles.heroTitle, isCompactHeight && styles.heroTitleCompact]}>
              A calmer, more premium start to your daily lead workflow.
            </Text>

            <Text style={[styles.heroSubtitle, isCompactHeight && styles.heroSubtitleCompact]}>
              Sign in to review inquiries and keep every property conversation in one place.
            </Text>

            <View style={[styles.featureRow, isCompactHeight && styles.featureRowCompact]}>
              <View style={[styles.featurePill, isCompactHeight && styles.featurePillCompact]}>
                <Ionicons name="sparkles-outline" size={14} color={palette.accentDeep} />
                <Text style={styles.featurePillText}>AI-assisted replies</Text>
              </View>
              <View style={[styles.featurePill, isCompactHeight && styles.featurePillCompact]}>
                <Ionicons name="shield-checkmark-outline" size={14} color={palette.accentDeep} />
                <Text style={styles.featurePillText}>Secure sign in</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(120).springify()}
            style={[styles.card, isCompactHeight && styles.cardCompact]}
          >
            <View style={[styles.cardHeader, isCompactHeight && styles.cardHeaderCompact]}>
              <Text style={styles.cardEyebrow}>Welcome back</Text>
              <Text style={styles.cardTitle}>Access your workspace</Text>
              <Text style={[styles.cardSubtitle, isCompactHeight && styles.cardSubtitleCompact]}>
                Use your account credentials to continue.
              </Text>
            </View>

            <Animated.View
              entering={FadeInDown.delay(180).springify()}
              style={[styles.formFieldGroup, isCompactHeight && styles.formFieldGroupCompact]}
            >
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputShell, isCompactHeight && styles.inputShellCompact]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="mail-outline" size={18} color={palette.accentDeep} />
                </View>
                <TextInput
                  style={styles.input}
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
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(240).springify()}
              style={[styles.formFieldGroup, isCompactHeight && styles.formFieldGroupCompact]}
            >
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputShell, isCompactHeight && styles.inputShellCompact]}>
                <View style={styles.iconWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={palette.accentDeep} />
                </View>
                <TextInput
                  style={styles.input}
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
                    color={palette.mutedText}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <AnimatedPressable
              style={[styles.buttonPressable, isCompactHeight && styles.buttonPressableCompact, buttonStyle]}
              onPress={handleLogin}
              onPressIn={() => {
                buttonScale.value = withSpring(0.98);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1);
              }}
              disabled={loading}
            >
              <LinearGradient
                colors={
                  loading
                    ? [palette.accentDeep, palette.accentDeep]
                    : [palette.accent, '#a24b2d', palette.accentDeep]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.buttonGradient, isCompactHeight && styles.buttonGradientCompact]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff7f1" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff7f1" />
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>

          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },
  scrollContentCompact: {
    justifyContent: 'center',
    paddingTop: 28,
    paddingBottom: 20,
  },
  backgroundOrbOne: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(184, 92, 56, 0.16)',
  },
  backgroundOrbTwo: {
    position: 'absolute',
    bottom: 90,
    left: -36,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(47, 93, 80, 0.12)',
  },
  heroSection: {
    marginBottom: 28,
  },
  heroSectionCompact: {
    marginBottom: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(47, 93, 80, 0.18)',
    backgroundColor: 'rgba(255, 249, 242, 0.72)',
    marginBottom: 18,
  },
  heroBadgeCompact: {
    marginBottom: 12,
    paddingVertical: 7,
  },
  heroBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.chipSoft,
  },
  heroBadgeText: {
    color: palette.chip,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.9,
    maxWidth: 340,
  },
  heroTitleCompact: {
    fontSize: 29,
    lineHeight: 34,
    maxWidth: 320,
  },
  heroSubtitle: {
    color: palette.mutedText,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 340,
  },
  heroSubtitleCompact: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    maxWidth: 320,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  featureRowCompact: {
    marginTop: 14,
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 249, 243, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(184, 92, 56, 0.14)',
  },
  featurePillCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  featurePillText: {
    color: palette.accentDeep,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.softLine,
    shadowColor: palette.cardShadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 10,
  },
  cardCompact: {
    borderRadius: 24,
    padding: 18,
  },
  cardHeader: {
    marginBottom: 22,
  },
  cardHeaderCompact: {
    marginBottom: 16,
  },
  cardEyebrow: {
    color: palette.accentDeep,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    color: palette.mutedText,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  cardSubtitleCompact: {
    lineHeight: 20,
    marginTop: 6,
  },
  formFieldGroup: {
    marginBottom: 16,
  },
  formFieldGroupCompact: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputShell: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: palette.inputSurface,
    borderWidth: 1,
    borderColor: 'rgba(184, 92, 56, 0.14)',
    paddingHorizontal: 14,
  },
  inputShellCompact: {
    minHeight: 54,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentSoft,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: palette.ink,
    fontSize: 15,
    paddingVertical: 16,
  },
  buttonPressable: {
    marginTop: 10,
  },
  buttonPressableCompact: {
    marginTop: 6,
  },
  buttonGradient: {
    minHeight: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: 'rgba(143, 61, 32, 0.3)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  buttonGradientCompact: {
    minHeight: 54,
  },
  buttonText: {
    color: '#fff7f1',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
