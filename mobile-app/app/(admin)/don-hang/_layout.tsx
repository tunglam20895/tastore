import { Stack } from "expo-router";
import AdminDetailHeader from "@/src/components/admin/AdminDetailHeader";

export default function DonHangStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="add" />
    </Stack>
  );
}
