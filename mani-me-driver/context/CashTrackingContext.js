// context/CashTrackingContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CashTrackingContext = createContext();

export const useCashTracking = () => useContext(CashTrackingContext);

export const CashTrackingProvider = ({ children }) => {
  const [cashPickups, setCashPickups] = useState([]);
  const [totalCash, setTotalCash] = useState(0);
  const [cashCount, setCashCount] = useState(0);

  // Load cash pickups from storage on mount
  useEffect(() => {
    loadCashPickups();
  }, []);

  // Update totals when pickups change
  useEffect(() => {
    const total = cashPickups.reduce((sum, pickup) => sum + pickup.amount, 0);
    setTotalCash(total);
    setCashCount(cashPickups.length);
  }, [cashPickups]);

  const loadCashPickups = async () => {
    try {
      const storedPickups = await AsyncStorage.getItem('cashPickups');
      if (storedPickups) {
        const pickups = JSON.parse(storedPickups);
        // Filter pickups from today only
        const today = new Date().toDateString();
        const todaysPickups = pickups.filter(p => 
          new Date(p.timestamp).toDateString() === today
        );
        setCashPickups(todaysPickups);
        await AsyncStorage.setItem('cashPickups', JSON.stringify(todaysPickups));
      }
    } catch (error) {
      console.error('Error loading cash pickups:', error);
    }
  };

  const addCashPickup = async (amount, parcelId = null) => {
    try {
      const newPickup = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        parcelId,
        timestamp: new Date().toISOString(),
      };
      const updatedPickups = [...cashPickups, newPickup];
      setCashPickups(updatedPickups);
      await AsyncStorage.setItem('cashPickups', JSON.stringify(updatedPickups));
      return { success: true };
    } catch (error) {
      console.error('Error adding cash pickup:', error);
      return { success: false, error: error.message };
    }
  };

  const clearCashPickups = async () => {
    try {
      setCashPickups([]);
      await AsyncStorage.removeItem('cashPickups');
      return { success: true };
    } catch (error) {
      console.error('Error clearing cash pickups:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    cashPickups,
    totalCash,
    cashCount,
    addCashPickup,
    clearCashPickups,
    loadCashPickups,
  };

  return (
    <CashTrackingContext.Provider value={value}>
      {children}
    </CashTrackingContext.Provider>
  );
};
