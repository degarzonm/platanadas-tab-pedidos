import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font'; 

export default function App() {
   const [fontsLoaded] = useFonts({
     'Fredoka-Regular': require('./assets/fonts/Fredoka-Regular.ttf'),
     'Fredoka-Bold': require('./assets/fonts/Fredoka-Bold.ttf'),
   });
   if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      {/* Barra de estado oscura para contrastar con fondo claro */}
      <StatusBar style="dark" />
      
      {/* Sistema de Navegación Principal */}
      <AppNavigator />
    </SafeAreaProvider>
  );
}