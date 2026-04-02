import { Stack } from 'expo-router';

export default function PaymentCardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
