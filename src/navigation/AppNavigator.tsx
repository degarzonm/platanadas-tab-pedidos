import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen'; 
import { BuilderScreen } from '../screens/BuilderScreen'; 
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SeasonalModal } from '../screens/SeasonalModal'; // Importamos el modal
import { COLORS } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.verdePinton,
        tabBarInactiveTintColor: COLORS.salsa,
        tabBarStyle: {
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            backgroundColor: COLORS.cream
        },
        tabBarLabelStyle: { fontSize: 12, fontFamily: 'System', fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Historial') iconName = focused ? 'time' : 'time-outline';
          return <Ionicons name={iconName} size={30} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Historial" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Pequeño delay para permitir que Zustand cargue desde AsyncStorage (hydration)
  useEffect(() => {
    // Aquí Zustand ya debería haber hidratado el estado gracias a persist()
    // pero un pequeño timeout asegura que la UI no parpadee entre Login/Main
    setTimeout(() => setIsReady(true), 100);
  }, []);

  if (!isReady) {
    return (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: COLORS.cream}}>
            <ActivityIndicator size="large" color={COLORS.verdePinton} />
        </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
            <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
            <>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen 
                    name="Builder" 
                    component={BuilderScreen} 
                    // options={{ presentation: 'fullScreenModal' }} // Desactivado por el bug de Expo New Arch
                />
                <Stack.Screen 
                    name="SeasonalModal" 
                    component={SeasonalModal} 
                    options={{ presentation: 'modal' }} // Esto permite que salga como popup
                />
                <Stack.Screen name="Checkout" component={CheckoutScreen} />
            </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}