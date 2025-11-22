import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import client from '../api/client';
import { useOrderStore } from '../store/useOrderStore';
import { useAuthStore } from '../store/useAuthStore';

export const LoginScreen = () => {
  const { setDatosDia } = useOrderStore();
  const { login } = useAuthStore();

  const [sucursalId, setSucursalId] = useState('bosque_popular');
  const [password, setPassword] = useState('pl4t4n4d4s');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!sucursalId || !password) {
      Alert.alert('Error', 'Por favor ingresa ID y contraseña');
      return;
    }

    setLoading(true);

    try {
      // 1. Login
      const loginRes = await client.post('/login-sucursal', {
        id: sucursalId,
        pass: password
      });

      const { token } = loginRes.data;

      // 2. Descargar Datos
      const datosRes = await client.get('/sucursal/datos-dia', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 3. Guardar en Stores
      const { ingredientes, platanadas_temporadas } = datosRes.data;

      setDatosDia(ingredientes, platanadas_temporadas);

      // Esto activará la navegación automática en AppNavigator
      login(token, sucursalId);

    } catch (error) {
      console.error(error);
      Alert.alert('Error de Conexión', 'Verifica tus credenciales o tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/icon.png')} style={{ width: 50, height: 50 }} />
          <Text style={styles.title}>Platanadas POS</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>ID Sucursal</Text>
          <TextInput
            style={styles.input}
            value={sucursalId}
            onChangeText={setSucursalId}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Iniciar Turno</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.amarilloMaduro,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.cream,
    padding: 40,
    borderRadius: 20,
    width: 400,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.salsa,
    marginTop: 10,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: COLORS.salsaBrown,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.verdePinton,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.salsa,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    ...SHADOWS.button,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});