// Rəqəmin 0-dan hədəfə "sayılması" — RN Animated listener ilə (done ekranı XP/zümrüd).
import { useEffect, useState } from "react";
import { Animated, Text, type TextStyle, type StyleProp } from "react-native";

export default function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 700,
  style,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  style?: StyleProp<TextStyle>;
}) {
  const [v] = useState(() => new Animated.Value(0));
  const [n, setN] = useState(0);

  useEffect(() => {
    const id = v.addListener(({ value }) => setN(Math.round(value)));
    Animated.timing(v, { toValue: to, duration, useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [to, duration, v]);

  return (
    <Text style={style}>
      {prefix}
      {n}
      {suffix}
    </Text>
  );
}
