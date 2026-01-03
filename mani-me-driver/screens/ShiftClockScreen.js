

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ShiftClockScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shift Clock</Text>
      <Text style={styles.info}>Track your work hours and view your shift history here. (Shift start/end functionality has been removed.)</Text>
    </View>
  );
}

// Remove all unreachable JSX below this point (if any)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});
