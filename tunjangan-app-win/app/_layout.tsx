import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="profil" />
      <Stack.Screen name="share-lokasi" />
      <Stack.Screen name="lembur" />
      <Stack.Screen name="standby" />
      <Stack.Screen name="draft" />
      <Stack.Screen name="rekap" />
    </Stack>
  );
}