// Hamar progress bar — RN Animated ilə (babel plugin lazım deyil, Expo Go-da işlək).
import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { C } from "@/lib/theme";

export default function AnimatedBar({
  pct,
  color = C.brand,
  height = 14,
}: {
  pct: number; // 0..100
  color?: string;
  height?: number;
}) {
  const [w] = useState(() => new Animated.Value(pct));

  useEffect(() => {
    Animated.timing(w, {
      toValue: pct,
      duration: 400,
      useNativeDriver: false, // en (width) native driver dəstəkləmir
    }).start();
  }, [pct, w]);

  const width = w.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.track, { height }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, backgroundColor: C.panel2, borderRadius: 8, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 8 },
});
