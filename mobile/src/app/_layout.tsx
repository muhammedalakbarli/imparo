import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { C } from "@/lib/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Nav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function Nav() {
  const { session, ready } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={C.brand} size="large" />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.ink } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="gorevler" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
