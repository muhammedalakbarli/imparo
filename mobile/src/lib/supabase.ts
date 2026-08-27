// Supabase RN client — AsyncStorage ilə sessiya davamlılığı + URL polyfill.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(url, anon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE — Google girişi (WebBrowser deep-link) code exchange üçün lazımdır.
    flowType: "pkce",
  },
});
