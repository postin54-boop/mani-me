import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = 'shop_ship_cart';

const ShopShipCartContext = createContext();

export function ShopShipCartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
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

  const loadCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async () => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving cart:', error);
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
  };

  // Calculate totals
  const totals = cartItems.reduce((acc, item) => ({
    itemsTotal: acc.itemsTotal + (item.price * item.quantity),
    totalWeight: acc.totalWeight + (item.weight_kg * item.quantity),
    itemCount: acc.itemCount + item.quantity,
  }), { itemsTotal: 0, totalWeight: 0, itemCount: 0 });

  // Determine box size and shipping cost
  const getShippingInfo = () => {
    const weight = totals.totalWeight;
    
    if (weight === 0) return { box: null, shipping: 0 };
    if (weight <= 5) return { box: 'Small Box', size: 'small', shipping: 25, maxWeight: 5 };
    if (weight <= 15) return { box: 'Medium Box', size: 'medium', shipping: 45, maxWeight: 15 };
    if (weight <= 30) return { box: 'Large Box', size: 'large', shipping: 75, maxWeight: 30 };
    
    // Extra large or multiple boxes needed
    const boxCount = Math.ceil(weight / 50);
    return { 
      box: 'Extra Large Box', 
      size: 'extra_large',
      shipping: 120 * boxCount, 
      maxWeight: 50,
      boxCount 
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
