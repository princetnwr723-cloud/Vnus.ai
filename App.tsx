// App.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, Text } from "react-native";

import ConnectScreen from "./src/screens/ConnectScreen";
import ModelSelectScreen from "./src/screens/ModelSelectScreen";
import HomeScreen from "./src/screens/HomeScreen";
import { getConnectedProvider, getSelectedModel, disconnectAll } from "./src/services/secureStorage";
import { useAppStore } from "./src/state/useAppStore";
import { ErrorBoundary } from "./src/components/ErrorBoundary";

const Stack = createNativeStackNavigator();

function AppInner() {
  const [checking, setChecking] = useState(true);
  const [initialRoute, setInitialRoute] = useState<"Connect" | "Home">("Connect");
  const [startupError, setStartupError] = useState<string | null>(null);
  const setConnected = useAppStore((s) => s.setConnected);

  useEffect(() => {
    (async () => {
      try {
        const provider = await getConnectedProvider();
        const model = await getSelectedModel();
        if (provider && model) {
          setConnected(provider, model);
          setInitialRoute("Home");
        }
      } catch (err: any) {
        // If restoring saved state itself fails, clear it and fall back to
        // Connect screen rather than getting stuck in a crash loop.
        setStartupError(err?.message || String(err));
        await disconnectAll().catch(() => {});
        setInitialRoute("Connect");
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {startupError && (
        <View style={{ backgroundColor: "#3a0000", padding: 10 }}>
          <Text style={{ color: "#ff8080", fontSize: 11 }}>Startup warning: {startupError}</Text>
        </View>
      )}
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Connect" component={ConnectScreen} />
        <Stack.Screen name="ModelSelect" component={ModelSelectScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}