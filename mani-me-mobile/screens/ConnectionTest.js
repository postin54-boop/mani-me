import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/api';
import { API_BASE_URL } from '../utils/config';

export default function ConnectionTest({ navigation }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState('');

  const testConnection = async () => {
    setTesting(true);
    setResult('Testing...');
    
    try {
      const response = await api.get('/auth/test');
      setResult(`✅ SUCCESS!\n${JSON.stringify(response.data, null, 2)}`);
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        setResult('❌ TIMEOUT\nServer took too long to respond');
      } else if (error.message === 'Network Error') {
        setResult('❌ NETWORK ERROR\nCannot reach server\n\nCheck:\n1. Server is running\n2. Phone on same WiFi\n3. IP: 192.168.0.138:4000');
      } else {
        setResult(`❌ ERROR\n${error.message}\n${error.response?.status || ''}`);
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Server Connection Test</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.serverUrl}>Server: {API_BASE_URL}</Text>
        
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={testConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.testButtonText}>Test Connection</Text>
          )}
        </TouchableOpacity>

        {result ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071528',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#0B1A33',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  serverUrl: {
    fontSize: 14,
    color: '#84C3EA',
    marginBottom: 24,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#84C3EA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#071528',
  },
  resultBox: {
    backgroundColor: '#0B1A33',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#84C3EA',
  },
  resultText: {
    fontSize: 14,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
