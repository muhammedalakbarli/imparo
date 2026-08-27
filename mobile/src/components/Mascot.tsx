// Zefi — köhnə `mood` API-ni ZefiMascot `emotion`-una çevirən nazik wrapper. Statik (animasiya yox).
import ZefiMascot, { type ZefiEmotion } from "./ZefiMascot";

type Mood = "happy" | "sad" | "celebrate";

const MOOD_TO_EMOTION: Record<Mood, ZefiEmotion> = {
  happy: "happy",
  sad: "worried",
  celebrate: "celebrating",
};

export default function Mascot({
  size = 120,
  mood = "happy",
}: {
  size?: number;
  mood?: Mood;
}) {
  return <ZefiMascot emotion={MOOD_TO_EMOTION[mood]} size={size} />;
}
