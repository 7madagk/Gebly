import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useSSO } from '@clerk/expo/experimental';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gebly, GeblyFonts } from '@/constants/theme';

type Language = 'en' | 'ar';

const ART_ASPECT = 1536 / 1024;

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { startSSOFlow } = useSSO();
  const [language, setLanguage] = useState<Language>('en');
  const [pending, setPending] = useState<SocialKind | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const topInset = Platform.OS === 'web' ? 59 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const continueWith = async (kind: SocialKind) => {
    if (!isLoaded || pending) {
      return;
    }

    setErrorMessage(null);
    setPending(kind);

    try {
      const result = await startSSOFlow({
        strategy: kind === 'apple' ? 'oauth_apple' : 'oauth_google',
        redirectUrl: Linking.createURL('sso-callback'),
      });

      if (result.createdSessionId) {
        return;
      }

      const sessionType = result.authSessionResult?.type;
      if (!sessionType || sessionType === 'cancel' || sessionType === 'dismiss') {
        return;
      }

      if (result.signUp?.status === 'missing_requirements' && result.signUp.missingFields.length > 0) {
        setErrorMessage(
          `Sign-in needs ${result.signUp.missingFields.join(', ')} before the account can be created.`,
        );
        return;
      }

      setErrorMessage('Sign-in returned to the app, but the account was not created. Try again.');
    } catch (error) {
      setErrorMessage(signInErrorMessage(error));
    } finally {
      setPending(null);
    }
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: topInset + 8, paddingBottom: bottomInset + 20 },
      ]}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/gebly-wordmark.png')}
          style={styles.wordmark}
          contentFit="contain"
          accessibilityLabel="Gebly"
        />
      </View>

      <View style={styles.artSlot}>
        <View style={styles.artFrame}>
          <Image
            source={require('@/assets/images/auth-demo-img.png')}
            style={styles.art}
            contentFit="contain"
            accessibilityLabel="A neighborhood of homes, a mosque, and trees"
          />
        </View>
      </View>

      <Text style={styles.headline}>
        Order from your{'\n'}neighborhood
      </Text>

      <View style={styles.actions}>
        {isSignedIn ? (
          <>
            <Text style={styles.signedInLabel}>
              Signed in{user?.firstName ? ` as ${user.firstName}` : ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              onPress={() => signOut()}
              style={({ pressed }) => [styles.button, styles.appleButton, pressed && styles.buttonPressed]}>
              <Text style={[styles.buttonLabel, styles.appleLabel]}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <SocialButton
              kind="apple"
              label="Continue with Apple"
              disabled={!isLoaded || pending !== null}
              onPress={() => continueWith('apple')}
            />
            <SocialButton
              kind="google"
              label="Continue with Google"
              disabled={!isLoaded || pending !== null}
              onPress={() => continueWith('google')}
            />
            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          </>
        )}
      </View>

      <Text style={styles.legal}>
        By continuing, you agree to Gebly&apos;s{'\n'}
        <Text style={styles.legalLink}>Terms & Privacy Policy.</Text>
      </Text>
    </View>
  );
}

function LanguageToggle({
  value,
  onChange,
}: {
  value: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      onPress={() => onChange(value === 'en' ? 'ar' : 'en')}
      style={({ pressed }) => [styles.langButton, pressed && styles.buttonPressed]}>
      <Text style={styles.langLabel}>{value === 'en' ? 'EN' : 'AR'}</Text>
      <Ionicons name="chevron-down" size={10} color={Gebly.text} />
    </Pressable>
  );
}

type SocialKind = 'apple' | 'google';

function signInErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    if ('longMessage' in error && typeof error.longMessage === 'string') {
      return error.longMessage;
    }
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }

  return 'Sign-in could not be started.';
}

function SocialButton({
  kind,
  label,
  disabled,
  onPress,
}: {
  kind: SocialKind;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const apple = kind === 'apple';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        apple ? styles.appleButton : styles.googleButton,
        (pressed || disabled) && styles.buttonPressed,
      ]}>
      <Image
        source={
          apple
            ? require('@/assets/images/apple-logo.svg')
            : require('@/assets/images/google-logo.svg')
        }
        style={apple ? styles.appleIcon : styles.googleIcon}
        contentFit="contain"
      />
      <Text style={[styles.buttonLabel, apple ? styles.appleLabel : styles.googleLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Gebly.surface,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 2,
  },
  wordmark: {
    width: 112,
    height: 43,
  },
  langButton: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Gebly.track,
    borderColor: Gebly.trackBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal:8,
    paddingVertical: 3,
    top: 1,
  },
  langLabel: {
    fontFamily: GeblyFonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    color: Gebly.text,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  artSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 18,
  },
  artFrame: {
    width: '128%',
    maxWidth: 436,
    aspectRatio: ART_ASPECT,
  },
  art: {
    width: '100%',
    height: '100%',
  },
  headline: {
    fontFamily: GeblyFonts.bold,
    fontSize: 24,
    lineHeight: 32,
    color: Gebly.text,
    letterSpacing: -0.45,
    marginTop: 10,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  actions: {
    marginTop: 64,
    gap: 12,
    marginHorizontal: -4,
  },
  button: {
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  appleButton: {
    backgroundColor: Gebly.black,
  },
  googleButton: {
    backgroundColor: Gebly.white,
    borderWidth: 1,
   borderColor: '#DADCE0',
  },
  buttonPressed: {
    opacity: 0.86,
  },
  appleIcon: {
    width: 16,
    height: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  buttonLabel: {
    fontFamily: GeblyFonts.medium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
    ...Platform.select({
      android: { includeFontPadding: false },
      default: {},
    }),
  },
  appleLabel: {
    color: Gebly.white,
  },
  googleLabel: {
    color: Gebly.text,
  },
  signedInLabel: {
    textAlign: 'center',
    fontFamily: GeblyFonts.medium,
    fontSize: 16,
    lineHeight: 22,
    color: Gebly.text,
  },
  error: {
    textAlign: 'center',
    fontFamily: GeblyFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Gebly.orange,
  },
  legal: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: GeblyFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Gebly.textSecondary,
  },
  legalLink: {
    fontFamily: GeblyFonts.medium,
    color: Gebly.orange,
  },
});
