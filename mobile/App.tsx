import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RegistracijaScreen from "./src/screens/RegistracijaScreen";
import ListaRestoranaScreen from "./src/screens/ListaRestoranaScreen";
import DetaljiRestoranaScreen from "./src/screens/DetaljiRestoranaScreen";
import MojeRezervacijeScreen from "./src/screens/MojeRezervacijeScreen";

const Stack = createNativeStackNavigator();

function MainStack() {
  const { loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#2c3e50" }, headerTintColor: "#fff" }}>
      <Stack.Screen name="ListaRestorana" component={ListaRestoranaScreen} options={{ title: "Restorani" }} />
      <Stack.Screen name="DetaljiRestorana" component={DetaljiRestoranaScreen} options={{ title: "Detalji" }} />
      <Stack.Screen name="MojeRezervacije" component={MojeRezervacijeScreen} options={{ title: "Moje rezervacije" }} />
      <Stack.Screen name="Login" options={{ title: "Prijava" }}>
        {(props) => <LoginScreen {...props} onSuccess={() => props.navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="Registracija" options={{ title: "Registracija" }}>
        {(props) => <RegistracijaScreen {...props} onSuccess={() => props.navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
