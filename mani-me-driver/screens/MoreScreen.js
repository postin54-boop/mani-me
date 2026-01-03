import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';


export default function MoreScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>More Options</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CashReconciliation')}
      >
        <Text style={styles.buttonText}>Submit Cash Reconciliation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071D33',
  },
  text: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  button: {
    marginTop: 32,
    backgroundColor: '#84C3EA',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: {
    color: '#071528',
    fontWeight: '700',
    fontSize: 16,
  },
});