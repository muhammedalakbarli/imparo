// "Zefi" — Imparo mascotu, peşəkar 3D illüstrasiya dəsti (şəffaf PNG). Statik (animasiya yox).
import { Image } from "react-native";

export type ZefiEmotion =
  | "welcome"
  | "happy"
  | "learning"
  | "celebrating"
  | "worried"
  | "thinking"
  | "gift";

// React Native require statik olmalıdır — hər poza ayrıca.
const SRC: Record<ZefiEmotion, ReturnType<typeof require>> = {
  welcome: require("../../assets/zefi/zefi_welcome.png"),
  gift: require("../../assets/zefi/zefi_gift.png"),
  happy: require("../../assets/zefi/zefi_happy.png"),
  learning: require("../../assets/zefi/zefi_learning.png"),
  celebrating: require("../../assets/zefi/zefi_celebrating.png"),
  worried: require("../../assets/zefi/zefi_worried.png"),
  thinking: require("../../assets/zefi/zefi_thinking.png"),
};

export default function ZefiMascot({
  emotion = "happy",
  size = 120,
}: {
  emotion?: ZefiEmotion;
  size?: number;
}) {
  return (
    <Image
      source={SRC[emotion]}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
