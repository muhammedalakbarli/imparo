import { Tabs } from "expo-router";
import { House, Dumbbell, Trophy, ShoppingBag, User } from "lucide-react-native";
import { C } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.panel, borderTopColor: C.line, height: 60, paddingBottom: 6, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Öyrən", tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }} />
      <Tabs.Screen name="praktika" options={{ title: "Praktika", tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} /> }} />
      <Tabs.Screen name="liqa" options={{ title: "Liqa", tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} />
      <Tabs.Screen name="magaza" options={{ title: "Mağaza", tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} /> }} />
      <Tabs.Screen name="profil" options={{ title: "Profil", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  );
}
