import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// Aquí podríamos cargar fuentes personalizadas (Fredoka, Poppins) si las añadimos a assets
// import { useFonts } from 'expo-font'; 

export default function App() {
  // Ejemplo de carga de fuentes (descomentar cuando tengas los archivos .ttf)
  // const [fontsLoaded] = useFonts({
  //   'Fredoka-Regular': require('./assets/fonts/Fredoka-Regular.ttf'),
  //   'Fredoka-Bold': require('./assets/fonts/Fredoka-Bold.ttf'),
  // });
  // if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      {/* Barra de estado oscura para contrastar con fondo claro */}
      <StatusBar style="dark" />
      
      {/* Sistema de Navegación Principal */}
      <AppNavigator />
    </SafeAreaProvider>
  );
}