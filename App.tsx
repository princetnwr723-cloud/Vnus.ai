// App.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";

import ConnectScreen from "./src/screens/ConnectScreen";
import ModelSelectScreen from "./src/screens/ModelSelectScreen";
import HomeScreen from "./src/screens/HomeScreen";
import { getConnectedProvider, getSelectedModel } from "./src/services/secureStorage";
import { useAppStore } from "./src/state/useAppStore";

const Stack = createNativeStackNavigator();

export default function App() {
  const [checking, setChecking] = useState(true);
  const [initialRoute, setInitialRoute] = useState<"Connect" | "Home">("Connect");
  const setConnected = useAppStore((s) => s.setConnected);

  useEffect(() => {
    (async () => {
      const provider = await getConnectedProvider();
      const model = await getSelectedModel();
      if (provider && model) {
        setConnected(provider, model);
        setInitialRoute("Home");
      }
      setChecking(false);
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
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Connect" component={ConnectScreen} />
        <Stack.Screen name="ModelSelect" component={ModelSelectScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
