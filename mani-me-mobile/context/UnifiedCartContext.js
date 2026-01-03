import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const CartContext = createContext();
const CART_STORAGE_KEY = '@mani_me:cart';
const MAX_QUANTITY_PER_ITEM = 99;

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a UnifiedCartProvider');
  }
  return context;
};

/**
 * Validates a product before adding to cart
 * @param {Object} product - Product to validate
 * @returns {Object} - { valid: boolean, error?: string }
 */
const validateProduct = (product) => {
  if (!product) {
    return { valid: false, error: 'Product is null or undefined' };
  }
  if (!product.id) {
    return { valid: false, error: 'Product must have an id' };
  }
  if (typeof product.price !== 'number' || isNaN(product.price) || product.price < 0) {
    return { valid: false, error: 'Product must have a valid price' };
  }
  if (!product.source || !['grocery', 'packaging'].includes(product.source)) {
    return { valid: false, error: 'Product source must be "grocery" or "packaging"' };
  }
  return { valid: true };
};

export function UnifiedCartProvider({ children }) {
  const [items, setItems] = useState([]); // {id, name, price, weight, source: 'grocery'|'packaging', quantity}
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Validate loaded items
          const validItems = parsedCart.filter(item => validateProduct(item).valid);
          setItems(validItems);
          logger.log('Cart loaded from storage:', validItems.length, 'items');
        }
      } catch (error) {
        logger.error('Error loading cart:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadCart();
  }, []);

  // Persist cart to AsyncStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      const saveCart = async () => {
        try {
          await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
          logger.error('Error saving cart:', error);
        }
      };
      saveCart();
    }
  }, [items, isLoaded]);

  const addItem = useCallback((product) => {
    // Validate product before adding
    const validation = validateProduct(product);
    if (!validation.valid) {
      logger.error('Invalid product:', validation.error, product);
      return false;
    }

    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        // Check max quantity
        if (found.quantity >= MAX_QUANTITY_PER_ITEM) {
          logger.warn('Max quantity reached for item:', product.id);
          return prev;
        }
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    return true;
  }, []);

  const increment = useCallback((id) => {
    if (!id) return;
    setItems((prev) => prev.map((i) => {
      if (i.id === id && i.quantity < MAX_QUANTITY_PER_ITEM) {
        return { ...i, quantity: i.quantity + 1 };
      }
      return i;
    }));
  }, []);

  const decrement = useCallback((id) => {
    if (!id) return;
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0));
  }, []);

  const removeItem = useCallback((id) => {
    if (!id) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemsBySource = useCallback((source) => {
    return items.filter(item => item.source === source);
  }, [items]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
    const weight = items.reduce((w, i) => w + (i.weight || 0) * (i.quantity || 0), 0);
    const shipping = weight * 2; // placeholder rule
    const total = subtotal + shipping;
    const itemCount = items.reduce((c, i) => c + (i.quantity || 0), 0);
    return { subtotal, weight, shipping, total, itemCount };
  }, [items]);

  const groceryTotals = useMemo(() => {
    const groceryItems = items.filter(i => i.source === 'grocery');
    const subtotal = groceryItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
    const weight = groceryItems.reduce((w, i) => w + (i.weight || 0) * (i.quantity || 0), 0);
    const itemCount = groceryItems.reduce((c, i) => c + (i.quantity || 0), 0);
    return { subtotal, weight, itemCount };
  }, [items]);

  const packagingTotals = useMemo(() => {
    const packagingItems = items.filter(i => i.source === 'packaging');
    const subtotal = packagingItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);
    const weight = packagingItems.reduce((w, i) => w + (i.weight || 0) * (i.quantity || 0), 0);
    const itemCount = packagingItems.reduce((c, i) => c + (i.quantity || 0), 0);
    return { subtotal, weight, itemCount };
  }, [items]);

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      increment, 
      decrement, 
      removeItem,
      clearCart, 
      totals,
      groceryTotals,
      packagingTotals,
      getItemsBySource,
      isLoaded
    }}>
      {children}
    </CartContext.Provider>
  );
}
