import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { testAppwriteConnection, APPWRITE_CONFIG } from '../config/appwrite';

interface ConnectionTestProps {
  onClose?: () => void;
}

export const AppwriteConnectionTest: React.FC<ConnectionTestProps> = ({ onClose }) => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setConnectionStatus('testing');
      setError('');
      
      console.log('Testing Appwrite connection...');
      const isConnected = await testAppwriteConnection();
      
      if (isConnected) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('failed');
        setError('Connection test failed');
      }
    } catch (err: any) {
      console.error('Connection test error:', err);
      setConnectionStatus('failed');
      setError(err.message || 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appwrite Connection Test</Text>
      
      <View style={styles.configSection}>
        <Text style={styles.configTitle}>Configuration:</Text>
        <Text style={styles.configText}>Endpoint: {APPWRITE_CONFIG.endpoint}</Text>
        <Text style={styles.configText}>Project ID: {APPWRITE_CONFIG.projectId}</Text>
        <Text style={styles.configText}>Database ID: {APPWRITE_CONFIG.databaseId}</Text>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.statusTitle}>Connection Status:</Text>
        <Text style={[
          styles.statusText,
          connectionStatus === 'success' ? styles.success :
          connectionStatus === 'failed' ? styles.error : styles.testing
        ]}>
          {connectionStatus === 'testing' ? 'Testing...' :
           connectionStatus === 'success' ? '✅ Connected' : '❌ Failed'}
        </Text>
        
        {error && (
          <Text style={styles.errorText}>Error: {error}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>Test Again</Text>
        </TouchableOpacity>
        
        {onClose && (
          <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  configSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  configTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  configText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statusSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
  testing: {
    color: 'orange',
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
  },
  closeButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
