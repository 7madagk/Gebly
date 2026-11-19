import { Gebly } from '@/constants/theme';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    const result = WebBrowser.maybeCompleteAuthSession();
    if (result.type !== 'success') {
      router.replace('/');
    }
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Gebly.surface }}>
      <ActivityIndicator color={Gebly.orange} />
    </View>
  );
}
