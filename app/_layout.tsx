import { Tabs } from 'expo-router';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { Platform, Text } from 'react-native';

// Show notifications even when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'NBA Hype Meter',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#9B7FFF',
      });
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0d0d1b',
            borderTopColor: '#1e1e35',
            borderTopWidth: 1,
            height: 62,
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: '#9B7FFF',
          tabBarInactiveTintColor: '#404060',
          tabBarLabelStyle: {
            fontFamily: 'BebasNeue_400Regular',
            fontSize: 10,
            letterSpacing: 1.5,
          },
          contentStyle: { backgroundColor: '#08080f' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'HYPE',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>🏀</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="paris"
          options={{
            title: 'PARIS',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>🎰</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="ttfl"
          options={{
            title: 'TTFL',
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>⭐</Text>
            ),
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
