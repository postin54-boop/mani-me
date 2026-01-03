import React from "react";
import { View, Text, Button, Alert } from "react-native";
import api from "../api/api";

export default function ApiTestScreen() {
  const testApi = async () => {
    try {
      const response = await api.get("/users");
      console.log("API Response:", response.data);
      Alert.alert("Success!", JSON.stringify(response.data));
    } catch (error) {
      console.log("API Error:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={{ marginTop: 80, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        Press the button to test your backend:
      </Text>
      <Button title="Test API" onPress={testApi} />
    </View>
  );
}
