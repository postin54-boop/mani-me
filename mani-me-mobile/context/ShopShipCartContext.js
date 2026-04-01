import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const CART_STORAGE_KEY = 'shop_ship_cart';
const DELIVERY_TYPE_KEY = 'shop_ship_delivery_type';

// Shipping prices by delivery type
const SHIPPING_RATES = {
  standard: {
    // 7-14 days, same container as regular parcels
    small: { name: 'Small Box', price: 25, maxWeight: 5, daysMin: 7, daysMax: 14 },
    medium: { name: 'Medium Box', price: 45, maxWeight: 15, daysMin: 7, daysMax: 14 },
    large: { name: 'Large Box', price: 75, maxWeight: 30, daysMin: 7, daysMax: 14 },
    extra_large: { name: 'Extra Large Box', price: 120, maxWeight: 50, daysMin: 7, daysMax: 14 },
  },
  express: {
    // 1-5 days, manually fulfilled in-house
    small: { name: 'Small Box Express', price: 65, maxWeight: 5, daysMin: 1, daysMax: 5 },
    medium: { name: 'Medium Box Express', price: 95, maxWeight: 15, daysMin: 1, daysMax: 5 },
    large: { name: 'Large Box Express', price: 150, maxWeight: 30, daysMin: 1, daysMax: 5 },
    // No extra_large for express
  },
};

const ShopShipCartContext = createContext();

export function ShopShipCartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [deliveryType, setDeliveryType] = useState('standard');
  const [loading, setLoading] = useState(true);

  // Load cart from storage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to storage whenever it changes
  useEffect(() => {
    if (!loading) {
      saveCart();
    }
  }, [cartItems, loading]);

  // Save delivery type when it changes
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(DELIVERY_TYPE_KEY, deliveryType);
    }
  }, [deliveryType, loading]);

  const loadCart = async () => {
    try {
      const [stored, storedDeliveryType] = await Promise.all([
        AsyncStorage.getItem(CART_STORAGE_KEY),
        AsyncStorage.getItem(DELIVERY_TYPE_KEY),
      ]);
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
      if (storedDeliveryType) {
        setDeliveryType(storedDeliveryType);
      }
    } catch (error) {
      logger.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      logger.error('Error saving cart:', error);
    }
  };

  const addToCart = (item) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => i.product_id === item.product_id);
      
      if (existingIndex >= 0) {
        // Update quantity if item exists
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        };
        return updated;
      }
      
      // Add new item
      return [...prev, item];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prev => prev.map(item => 
      item.product_id === productId 
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDeliveryType('standard');
  };

  // Calculate totals
  const totals = cartItems.reduce((acc, item) => ({
    itemsTotal: acc.itemsTotal + (item.price * item.quantity),
    totalWeight: acc.totalWeight + (item.weight_kg * item.quantity),
    itemCount: acc.itemCount + item.quantity,
  }), { itemsTotal: 0, totalWeight: 0, itemCount: 0 });

  // Determine box size and shipping cost based on delivery type
  const getShippingInfo = () => {
    const weight = totals.totalWeight;
    const rates = SHIPPING_RATES[deliveryType];
    
    if (weight === 0) return { box: null, shipping: 0, deliveryType };
    
    // Find the smallest box that fits
    if (weight <= rates.small.maxWeight) {
      return { 
        box: rates.small.name, 
        size: 'small', 
        shipping: rates.small.price, 
        maxWeight: rates.small.maxWeight,
        daysMin: rates.small.daysMin,
        daysMax: rates.small.daysMax,
        deliveryType 
      };
    }
    if (weight <= rates.medium.maxWeight) {
      return { 
        box: rates.medium.name, 
        size: 'medium', 
        shipping: rates.medium.price, 
        maxWeight: rates.medium.maxWeight,
        daysMin: rates.medium.daysMin,
        daysMax: rates.medium.daysMax,
        deliveryType 
      };
    }
    
    // Check if express has large box (express max is 30kg for large)
    if (deliveryType === 'express') {
      if (weight <= rates.large.maxWeight) {
        return { 
          box: rates.large.name, 
          size: 'large', 
          shipping: rates.large.price, 
          maxWeight: rates.large.maxWeight,
          daysMin: rates.large.daysMin,
          daysMax: rates.large.daysMax,
          deliveryType 
        };
      }
      // Express doesn't support > 30kg, fall back to standard
      return { 
        box: 'Too Heavy for Express', 
        size: null,
        shipping: 0, 
        maxWeight: 30,
        error: 'Express delivery only available for orders up to 30kg',
        deliveryType: 'express'
      };
    }
    
    // Standard delivery
    if (weight <= rates.large.maxWeight) {
      return { 
        box: rates.large.name, 
        size: 'large', 
        shipping: rates.large.price, 
        maxWeight: rates.large.maxWeight,
        daysMin: rates.large.daysMin,
        daysMax: rates.large.daysMax,
        deliveryType 
      };
    }
    
    // Extra large or multiple boxes needed (standard only)
    const boxCount = Math.ceil(weight / rates.extra_large.maxWeight);
    return { 
      box: rates.extra_large.name, 
      size: 'extra_large',
      shipping: rates.extra_large.price * boxCount, 
      maxWeight: rates.extra_large.maxWeight,
      daysMin: rates.extra_large.daysMin,
      daysMax: rates.extra_large.daysMax,
      boxCount,
      deliveryType 
    };
  };

  const shippingInfo = getShippingInfo();
  
  // Service fee (5% of items, min £2)
  const serviceFee = Math.max(totals.itemsTotal * 0.05, cartItems.length > 0 ? 2 : 0);
  
  // Grand total
  const grandTotal = totals.itemsTotal + shippingInfo.shipping + serviceFee;

  const value = {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totals,
    shippingInfo,
    serviceFee,
    grandTotal,
    deliveryType,
    setDeliveryType,
  };

  return (
    <ShopShipCartContext.Provider value={value}>
      {children}
    </ShopShipCartContext.Provider>
  );
}

export function useShopShipCart() {
  const context = useContext(ShopShipCartContext);
  if (!context) {
    throw new Error('useShopShipCart must be used within a ShopShipCartProvider');
  }
  return context;
}
