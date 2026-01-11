import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';
import { BOX_TYPES, ITEM_CATEGORIES, CUSTOM_ITEM_SIZES } from '../constants/bookingData';
import { API_BASE_URL } from '../utils/config';

export default function BookingScreen({ navigation, route }) {
  const { colors, isDark } = useThemeColors();
  const savedData = route?.params?.savedData;

  // ========================================
  // ADMIN-CONTROLLED PRICING STATE
  // ========================================
  const [adminPrices, setAdminPrices] = useState({});
  const [pricesLoaded, setPricesLoaded] = useState(false);

  // Fetch admin-set prices on mount
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const fetchPrices = async () => {
      try {
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        const response = await fetch(`${API_BASE_URL}/api/parcel-prices`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok && isMounted) {
          const prices = await response.json();
          // Convert array to object for easy lookup: { 'small_box': 45, 'medium_box': 75, ... }
          const priceMap = {};
          prices.forEach(p => {
            priceMap[p.type] = p.price;
          });
          setAdminPrices(priceMap);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          logger.error('Failed to fetch admin prices:', error);
        }
        // Will use fallback prices from bookingData.js
      } finally {
        if (isMounted) {
          setPricesLoaded(true);
        }
      }
    };
    fetchPrices();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // ========================================
  // BOOKING MODE SELECTION
  // ========================================
  const [bookingMode, setBookingMode] = useState(null); // 'box' or 'item'

  // ========================================
  // SENDER & PICKUP DETAILS (SHARED)
  // ========================================
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupPostcode, setPickupPostcode] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // ========================================
  // A. BOX-BASED MODE STATE
  // ========================================
  const [selectedBoxes, setSelectedBoxes] = useState([]); // [{boxId, quantity, totalPrice}]

  // ========================================
  // B. ITEM-BASED MODE STATE
  // ========================================
  const [selectedItems, setSelectedItems] = useState([]); // [{itemId, categoryId, label, quantity, price, customName?}]
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [customItemName, setCustomItemName] = useState('');
  const [selectedCustomSize, setSelectedCustomSize] = useState(null); // For "Other" item size selection

  // ========================================
  // SAVE & RESTORE BOOKING PROGRESS
  // ========================================
  
  // Save booking progress to AsyncStorage
  const saveBookingProgress = useCallback(async () => {
    try {
      const bookingData = {
        bookingMode,
        senderName,
        senderPhone,
        senderEmail,
        pickupAddress,
        pickupCity,
        pickupPostcode,
        pickupDate,
        pickupTime,
        specialInstructions,
        selectedBoxes,
        selectedItems,
      };
      
      // Only save if there's meaningful data
      if (bookingMode || senderName || selectedBoxes.length > 0 || selectedItems.length > 0) {
        await AsyncStorage.setItem('lastBookingData', JSON.stringify(bookingData));
        await AsyncStorage.setItem('lastBookingStep', bookingMode ? 'details' : 'mode');
      }
    } catch (e) {
      console.log('Error saving booking progress:', e);
    }
  }, [bookingMode, senderName, senderPhone, senderEmail, pickupAddress, pickupCity, pickupPostcode, pickupDate, pickupTime, specialInstructions, selectedBoxes, selectedItems]);

  // Auto-save progress when data changes
  useEffect(() => {
    saveBookingProgress();
  }, [saveBookingProgress]);

  // Restore saved booking data when screen loads with savedData
  useEffect(() => {
    if (savedData) {
      if (savedData.bookingMode) setBookingMode(savedData.bookingMode);
      if (savedData.senderName) setSenderName(savedData.senderName);
      if (savedData.senderPhone) setSenderPhone(savedData.senderPhone);
      if (savedData.senderEmail) setSenderEmail(savedData.senderEmail);
      if (savedData.pickupAddress) setPickupAddress(savedData.pickupAddress);
      if (savedData.pickupCity) setPickupCity(savedData.pickupCity);
      if (savedData.pickupPostcode) setPickupPostcode(savedData.pickupPostcode);
      if (savedData.pickupDate) setPickupDate(savedData.pickupDate);
      if (savedData.pickupTime) setPickupTime(savedData.pickupTime);
      if (savedData.specialInstructions) setSpecialInstructions(savedData.specialInstructions);
      if (savedData.selectedBoxes) setSelectedBoxes(savedData.selectedBoxes);
      if (savedData.selectedItems) setSelectedItems(savedData.selectedItems);
    }
  }, [savedData]);

  // Clear saved progress when booking is completed
  const clearBookingProgress = async () => {
    try {
      await AsyncStorage.removeItem('lastBookingData');
      await AsyncStorage.removeItem('lastBookingStep');
    } catch (e) {
      console.log('Error clearing booking progress:', e);
    }
  };

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  // Get price: Use admin price if available, otherwise fallback to local
  const getPrice = (typeId, fallbackPrice) => {
    return adminPrices[typeId] || fallbackPrice;
  };

  // Generate date options (next 30 days)
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
      const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      dates.push({
        label: i === 0 ? `Today (${dateStr})` : i === 1 ? `Tomorrow (${dateStr})` : `${dayName}, ${dateStr}`,
        value: dateStr
      });
    }
    return dates;
  };

  // Time slots (24 hours, 1-hour intervals) with AM/PM format
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const formatHour = (hour) => {
      const h = hour % 12 || 12;
      const suffix = hour < 12 ? 'AM' : 'PM';
      return `${h}:00 ${suffix}`;
    };
    const start = formatHour(i);
    const end = formatHour((i + 1) % 24);
    return `${start} - ${end}`;
  });

  // ========================================
  // BOX MODE FUNCTIONS
  // ========================================

  const addBox = (boxId) => {
    const existingBox = selectedBoxes.find(b => b.boxId === boxId);
    const boxData = BOX_TYPES.find(b => b.id === boxId);
    const currentPrice = getPrice(boxId, boxData.basePrice);
    
    if (existingBox) {
      // Increment quantity
      setSelectedBoxes(selectedBoxes.map(b => 
        b.boxId === boxId 
          ? { ...b, quantity: b.quantity + 1, totalPrice: currentPrice * (b.quantity + 1) }
          : b
      ));
    } else {
      // Add new box
      setSelectedBoxes([...selectedBoxes, {
        boxId,
        label: boxData.label,
        quantity: 1,
        unitPrice: getPrice(boxId, boxData.basePrice),
        totalPrice: getPrice(boxId, boxData.basePrice),
      }]);
    }
  };

  const updateBoxQuantity = (boxId, newQuantity) => {
    if (newQuantity < 1) {
      removeBox(boxId);
      return;
    }
    const boxData = BOX_TYPES.find(b => b.id === boxId);
    const currentPrice = getPrice(boxId, boxData.basePrice);
    setSelectedBoxes(selectedBoxes.map(b => 
      b.boxId === boxId 
        ? { ...b, quantity: newQuantity, totalPrice: currentPrice * newQuantity }
        : b
    ));
  };

  const removeBox = (boxId) => {
    setSelectedBoxes(selectedBoxes.filter(b => b.boxId !== boxId));
  };

  // ========================================
  // ITEM MODE FUNCTIONS
  // ========================================

  const addItem = (categoryId, item) => {
    // Check if requires custom input
    if (item.requiresInput) {
      if (!customItemName.trim()) {
        Alert.alert('Custom Item Name Required', 'Please enter a name for this item');
        return;
      }
      if (!selectedCustomSize) {
        Alert.alert('Size Required', 'Please select a size for your item');
        return;
      }
    }

    // For custom items, use the selected size pricing
    let currentPrice, itemSize, itemWeight;
    if (item.requiresInput && selectedCustomSize) {
      currentPrice = getPrice(`custom_${selectedCustomSize.id}`, selectedCustomSize.basePrice);
      itemSize = selectedCustomSize.label;
      itemWeight = selectedCustomSize.estimatedWeight;
    } else {
      currentPrice = getPrice(item.id, item.basePrice);
      itemSize = item.size;
      itemWeight = item.estimatedWeight;
    }

    const newItem = {
      id: Date.now(),
      categoryId,
      itemId: item.id,
      label: item.label,
      customName: item.requiresInput ? customItemName.trim() : null,
      quantity: 1,
      unitPrice: currentPrice,
      totalPrice: currentPrice,
      size: itemSize,
      estimatedWeight: itemWeight,
      isCustomItem: item.requiresInput || false,
    };

    setSelectedItems([...selectedItems, newItem]);
    setCustomItemName('');
    setSelectedCustomSize(null);
    setShowItemSelector(false);
    setSelectedCategory(null);
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    setSelectedItems(selectedItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    ));
  };

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  // ========================================
  // VALIDATION & CONTINUE
  // ========================================

  const calculateTotal = () => {
    if (bookingMode === 'box') {
      return selectedBoxes.reduce((sum, box) => sum + box.totalPrice, 0);
    } else {
      return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    }
  };

  const handleContinue = () => {
    // Validate sender details
    if (!senderName || !senderPhone || !senderEmail || !pickupAddress || 
        !pickupCity || !pickupPostcode) {
      Alert.alert('Missing Details', 'Please fill in all required sender and pickup details');
      return;
    }

    if (!pickupDate || !pickupTime) {
      Alert.alert('Missing Pickup Schedule', 'Please select a pickup date and time');
      return;
    }

    // Validate items/boxes
    if (bookingMode === 'box' && selectedBoxes.length === 0) {
      Alert.alert('No Boxes Selected', 'Please add at least one box to your shipment');
      return;
    }

    if (bookingMode === 'item' && selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please add at least one item to your shipment');
      return;
    }

    // Navigate to Receiver Details screen with all data
    // Clear saved progress since user is moving forward
    clearBookingProgress();
    
    navigation.navigate('ReceiverDetails', {
      senderData: {
        booking_mode: bookingMode,
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_email: senderEmail,
        pickup_address: pickupAddress,
        pickup_city: pickupCity,
        pickup_postcode: pickupPostcode,
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        boxes: bookingMode === 'box' ? selectedBoxes : [],
        items: bookingMode === 'item' ? selectedItems : [],
        total_estimated_price: calculateTotal(),
        special_instructions: specialInstructions
      }
    });
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.background]}
          style={styles.header}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={28} color={colors.accent} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.iconWrapper}>
              <Ionicons name="cube" size={32} color={colors.secondary} />
            </View>
            <Text style={[styles.title, { color: colors.accent }]}>Book Parcel Pickup</Text>
            <Text style={[styles.subtitle, { color: colors.accent + 'CC' }]}>Send parcels from UK to Ghana</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          
          {/* ======================================== */}
          {/* STEP 1: SELECT BOOKING MODE */}
          {/* ======================================== */}
          {!bookingMode && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary, textAlign: 'center', marginBottom: SIZES.lg, fontSize: SIZES.h4 }]}>
                How would you like to book?
              </Text>
              
              {/* Box-Based Option */}
              <TouchableOpacity 
                style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setBookingMode('box')}
                activeOpacity={0.8}
              >
                <View style={[styles.modeIcon, { backgroundColor: '#10B98110' }]}>
                  <Ionicons name="cube" size={40} color="#10B981" />
                </View>
                <View style={styles.modeContent}>
                  <Text style={[styles.modeTitle, { color: colors.text }]}>📦 Box Packages</Text>
                  <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                    Pre-packaged boxes with fixed prices{'\n'}
                    Simple, fast, no item listing needed
                  </Text>
                  <View style={styles.modeBadge}>
                    <Text style={styles.modeBadgeText}>MOST POPULAR</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </TouchableOpacity>

              {/* Item-Based Option */}
              <TouchableOpacity 
                style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: SIZES.md }]}
                onPress={() => setBookingMode('item')}
                activeOpacity={0.8}
              >
                <View style={[styles.modeIcon, { backgroundColor: '#3B82F610' }]}>
                  <Ionicons name="list" size={40} color="#3B82F6" />
                </View>
                <View style={styles.modeContent}>
                  <Text style={[styles.modeTitle, { color: colors.text }]}>🧺 Individual Items</Text>
                  <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                    Select specific items from our catalog{'\n'}
                    Perfect for large or special items
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* ======================================== */}
          {/* STEP 2: SENDER DETAILS & ITEM SELECTION */}
          {/* ======================================== */}
          {bookingMode && (
            <>
              {/* Mode Indicator with Change Button */}
              <View style={[styles.modeIndicator, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Ionicons 
                    name={bookingMode === 'box' ? 'cube' : 'list'} 
                    size={20} 
                    color={bookingMode === 'box' ? '#10B981' : '#3B82F6'} 
                  />
                  <Text style={[styles.modeIndicatorText, { color: colors.text }]}>
                    {bookingMode === 'box' ? '📦 Box Packages' : '🧺 Individual Items'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => {
                  Alert.alert(
                    'Change Booking Mode?',
                    'This will clear your current selection',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Change', 
                        style: 'destructive',
                        onPress: () => {
                          setBookingMode(null);
                          setSelectedBoxes([]);
                          setSelectedItems([]);
                        }
                      }
                    ]
                  );
                }}>
                  <Text style={{ color: colors.secondary, fontWeight: '600' }}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* DYNAMIC CONTENT BASED ON MODE */}
              {bookingMode === 'box' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="cube" size={20} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Select Box Packages</Text>
                  </View>

                  {/* Box Types Grid */}
                  {BOX_TYPES.map((box) => {
                    const selectedBox = selectedBoxes.find(b => b.boxId === box.id);
                    return (
                      <View key={box.id} style={[styles.boxCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.xs }}>
                            <View style={[styles.boxIconSmall, { backgroundColor: box.color + '20' }]}>
                              <Ionicons name={box.icon} size={24} color={box.color} />
                            </View>
                            <Text style={[styles.boxLabel, { color: colors.text }]}>{box.label}</Text>
                          </View>
                          <Text style={[styles.boxDescription, { color: colors.textSecondary }]}>{box.description}</Text>
                          <Text style={[styles.boxDimensions, { color: colors.textSecondary }]}>{box.dimensions}</Text>
                        </View>
                        
                        {selectedBox ? (
                          <View style={styles.quantityControls}>
                            <TouchableOpacity onPress={() => updateBoxQuantity(box.id, selectedBox.quantity - 1)}>
                              <Ionicons name="remove-circle" size={32} color={colors.error} />
                            </TouchableOpacity>
                            <Text style={[styles.quantityText, { color: colors.text }]}>{selectedBox.quantity}</Text>
                            <TouchableOpacity onPress={() => updateBoxQuantity(box.id, selectedBox.quantity + 1)}>
                              <Ionicons name="add-circle" size={32} color={colors.secondary} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity 
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={() => addBox(box.id)}
                          >
                            <Ionicons name="add" size={24} color={colors.accent} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}

                  {/* Selected Boxes Summary */}
                  {selectedBoxes.length > 0 && (
                    <View style={[styles.summaryCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
                      <Text style={[styles.summaryTitle, { color: colors.primary }]}>
                        {selectedBoxes.reduce((sum, b) => sum + b.quantity, 0)} Box(es) Selected
                      </Text>
                      {selectedBoxes.map((box) => (
                        <View key={box.boxId} style={styles.summaryRow}>
                          <Text style={{ color: colors.text }}>{box.label} × {box.quantity}</Text>
                          <Text style={{ color: colors.primary, fontWeight: '600' }}>£{box.totalPrice}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {bookingMode === 'item' && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="list" size={20} color={colors.primary} />
                    <Text style={[styles.sectionTitle, { color: colors.primary }]}>Select Items</Text>
                  </View>

                  {/* Add Item Button */}
                  <TouchableOpacity 
                    style={[styles.addItemButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                    onPress={() => setShowItemSelector(true)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '600', marginLeft: SIZES.sm }}>
                      Add Item to Shipment
                    </Text>
                  </TouchableOpacity>

                  {/* Selected Items List */}
                  {selectedItems.length > 0 && (
                    <View style={[styles.itemsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      {selectedItems.map((item) => (
                        <View key={item.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemLabel, { color: colors.text }]}>
                              {item.customName || item.label}
                            </Text>
                            {item.size && (
                              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                                Size: {item.size}
                              </Text>
                            )}
                          </View>
                          
                          <View style={styles.itemControls}>
                            <View style={styles.quantityControls}>
                              <TouchableOpacity onPress={() => updateItemQuantity(item.id, item.quantity - 1)}>
                                <Ionicons name="remove-circle" size={28} color={colors.error} />
                              </TouchableOpacity>
                              <Text style={[styles.quantityText, { color: colors.text, fontSize: SIZES.body }]}>{item.quantity}</Text>
                              <TouchableOpacity onPress={() => updateItemQuantity(item.id, item.quantity + 1)}>
                                <Ionicons name="add-circle" size={28} color={colors.secondary} />
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => removeItem(item.id)} style={{ marginTop: SIZES.xs }}>
                              <Ionicons name="trash-outline" size={20} color={colors.error} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                      
                      <View style={[styles.summaryRow, { marginTop: SIZES.md, paddingTop: SIZES.md, borderTopWidth: 1, borderTopColor: colors.border }]}>
                        <Text style={[styles.summaryTitle, { color: colors.primary }]}>
                          Total Items: {selectedItems.reduce((sum, i) => sum + i.quantity, 0)}
                        </Text>
                        <Text style={[styles.summaryTitle, { color: colors.primary }]}>
                          £{calculateTotal()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Sender Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>Sender Information</Text>
                </View>
                
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Full Name *"
                    placeholderTextColor={colors.textSecondary}
                    value={senderName}
                    onChangeText={setSenderName}
                  />
                </View>
                
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="call-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Phone Number *"
                    placeholderTextColor={colors.textSecondary}
                    value={senderPhone}
                    onChangeText={setSenderPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email Address *"
                    placeholderTextColor={colors.textSecondary}
                    value={senderEmail}
                    onChangeText={setSenderEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Pickup Address */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.primary }]}>Pickup Address (UK)</Text>
                </View>
                
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'flex-start' }]}>
                  <Ionicons name="home-outline" size={20} color={colors.primary} style={[styles.inputIcon, { marginTop: SIZES.md }]} />
                  <TextInput
                    style={[styles.input, styles.textArea, { color: colors.text }]}
                    placeholder="Street Address *"
                    placeholderTextColor={colors.textSecondary}
                    value={pickupAddress}
                    onChangeText={setPickupAddress}
                    multiline
                    numberOfLines={2}
                  />
                </View>
                
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="business-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="City *"
                    placeholderTextColor={colors.textSecondary}
                    value={pickupCity}
                    onChangeText={setPickupCity}
                  />
                </View>
                
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Postcode *"
                    placeholderTextColor={colors.textSecondary}
                    value={pickupPostcode}
                    onChangeText={setPickupPostcode}
                    autoCapitalize="characters"
                  />
                </View>
                
                {/* Pickup Date & Time */}
                <View style={styles.row}>
                  <TouchableOpacity 
                    style={[styles.inputWrapper, styles.halfInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: pickupDate ? colors.text : colors.textSecondary }]}>
                      {pickupDate || 'Date *'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.inputWrapper, styles.halfInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: pickupTime ? colors.text : colors.textSecondary }]}>
                      {pickupTime || 'Time *'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Special Instructions */}
              <View style={styles.section}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea, { color: colors.text }]}
                    placeholder="Special Instructions (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={specialInstructions}
                    onChangeText={setSpecialInstructions}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ======================================== */}
      {/* ITEM SELECTOR MODAL */}
      {/* ======================================== */}
      <Modal
        visible={showItemSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowItemSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Item</Text>
              <TouchableOpacity onPress={() => setShowItemSelector(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {ITEM_CATEGORIES.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <Text style={[styles.categoryTitle, { color: colors.primary }]}>{category.title}</Text>
                  {category.items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.itemOption, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => {
                        if (item.requiresInput) {
                          setShowItemSelector(false); // Close item selector first
                          setTimeout(() => {
                            setSelectedCategory({ categoryId: category.id, item });
                          }, 300); // Increased delay to ensure modal is fully closed
                        } else {
                          addItem(category.id, item);
                        }
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemOptionLabel, { color: colors.text }]}>{item.label}</Text>
                        {item.size && !item.requiresInput && (
                          <Text style={[styles.itemOptionMeta, { color: colors.textSecondary }]}>
                            Size: {item.size}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Item Name Input Modal - Only show when item selector is closed */}
      {selectedCategory && !showItemSelector && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setSelectedCategory(null);
            setCustomItemName('');
            setSelectedCustomSize(null);
          }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={[styles.customItemModal, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
              <Text style={[styles.modalTitle, { color: colors.text, marginBottom: SIZES.md }]}>Add Custom Item</Text>
              
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ flexGrow: 0 }}
              >
                {/* Item Name Input */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: SIZES.xs }]}>Item Name *</Text>
                <TextInput
                  style={[styles.customItemInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="e.g., Standing Fan, Laptop, etc."
                  placeholderTextColor={colors.textSecondary}
                  value={customItemName}
                  onChangeText={setCustomItemName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />

                {/* Size Selection */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: SIZES.md, marginBottom: SIZES.sm }]}>
                  Select Size * (determines price)
                </Text>
                {CUSTOM_ITEM_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size.id}
                    activeOpacity={0.7}
                    style={[
                      styles.sizeOption,
                      { 
                        backgroundColor: selectedCustomSize?.id === size.id ? colors.primary + '20' : colors.background,
                        borderColor: selectedCustomSize?.id === size.id ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => {
                      console.log('Size selected:', size.id, size.label);
                      setSelectedCustomSize(size);
                    }}
                  >
                    <View style={styles.sizeOptionContent}>
                      <Text style={{ fontSize: 20, marginRight: SIZES.sm }}>{size.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sizeOptionLabel, { color: colors.text }]}>{size.label}</Text>
                        <Text style={[styles.sizeOptionDesc, { color: colors.textSecondary }]}>{size.description}</Text>
                      </View>
                      <Text style={[styles.sizeOptionPrice, { color: colors.primary }]}>£{size.basePrice}</Text>
                    </View>
                    {selectedCustomSize?.id === size.id && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} style={{ position: 'absolute', right: SIZES.md, top: '50%', marginTop: -12 }} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Buttons - Outside ScrollView for reliable taps */}
              <View style={[styles.customItemButtons, { marginTop: SIZES.lg }]}>
                <TouchableOpacity 
                  style={[styles.customItemButton, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setSelectedCategory(null);
                    setCustomItemName('');
                    setSelectedCustomSize(null);
                  }}
                >
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  style={[styles.customItemButton, { backgroundColor: colors.primary, opacity: (!customItemName.trim() || !selectedCustomSize) ? 0.5 : 1 }]}
                  onPress={() => {
                    console.log('Add Item pressed', { customItemName, selectedCustomSize: selectedCustomSize ? selectedCustomSize.label : null });
                    Alert.alert('Debug', `Name: "${customItemName}", Size: ${selectedCustomSize ? selectedCustomSize.label : 'NOT SELECTED'}`);
                    if (customItemName.trim() && selectedCustomSize) {
                      addItem(selectedCategory.categoryId, selectedCategory.item);
                    }
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    Add Item {selectedCustomSize ? `(£${selectedCustomSize.basePrice})` : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ======================================== */}
      {/* DATE PICKER MODAL */}
      {/* ======================================== */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Pickup Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {getDateOptions().map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.border },
                    pickupDate === option.value && { backgroundColor: colors.primary + '15' }
                  ]}
                  onPress={() => {
                    setPickupDate(option.value);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: pickupDate === option.value ? colors.primary : colors.text }]}>
                    {option.label}
                  </Text>
                  {pickupDate === option.value && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================== */}
      {/* TIME PICKER MODAL */}
      {/* ======================================== */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: colors.surface }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Pickup Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerOptions}>
              {timeSlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: colors.border },
                    pickupTime === slot && { backgroundColor: colors.primary + '15' }
                  ]}
                  onPress={() => {
                    setPickupTime(slot);
                    setShowTimePicker(false);
                  }}
                >
                  <Ionicons name="time-outline" size={20} color={colors.secondary} style={{ marginRight: SIZES.sm }} />
                  <Text style={[styles.pickerOptionText, { color: pickupTime === slot ? colors.primary : colors.text }]}>
                    {slot}
                  </Text>
                  {pickupTime === slot && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================== */}
      {/* FIXED CONTINUE BUTTON */}
      {/* ======================================== */}
      {bookingMode && (
        <View style={[styles.fixedButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View style={styles.totalBar}>
            <Text style={{ color: colors.textSecondary }}>Estimated Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>£{calculateTotal()}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: colors.primary }]} 
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <Text style={[styles.continueButtonText, { color: colors.accent }]}>Continue to Receiver Details</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: SIZES.lg,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SIZES.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.sm,
  },
  title: {
    fontSize: SIZES.h3,
    ...FONTS.bold,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.body,
  },
  formContainer: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.lg,
    marginTop: -20,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  sectionTitle: {
    fontSize: SIZES.h5,
    ...FONTS.semiBold,
    marginLeft: SIZES.sm,
  },
  
  // Mode Selection Cards
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.lg,
    borderRadius: SIZES.radiusLg,
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  modeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.md,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
    marginBottom: SIZES.xs / 2,
  },
  modeDescription: {
    fontSize: SIZES.bodySmall,
    lineHeight: 20,
  },
  modeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: SIZES.sm,
    paddingVertical: 4,
    borderRadius: SIZES.radiusSm,
    alignSelf: 'flex-start',
    marginTop: SIZES.xs,
  },
  modeBadgeText: {
    color: '#FFF',
    fontSize: SIZES.caption,
    ...FONTS.bold,
  },
  
  // Mode Indicator
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: SIZES.md,
  },
  modeIndicatorText: {
    marginLeft: SIZES.sm,
    ...FONTS.medium,
  },

  // Box Cards
  boxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  boxIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.sm,
  },
  boxLabel: {
    fontSize: SIZES.h6,
    ...FONTS.bold,
  },
  boxDescription: {
    fontSize: SIZES.bodySmall,
    marginTop: SIZES.xs / 2,
  },
  boxDimensions: {
    fontSize: SIZES.caption,
    marginTop: SIZES.xs / 2,
  },
  boxPrice: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
    marginTop: SIZES.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  quantityText: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
    minWidth: 30,
    textAlign: 'center',
  },

  // Summary Card
  summaryCard: {
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginTop: SIZES.md,
  },
  summaryTitle: {
    fontSize: SIZES.h6,
    ...FONTS.bold,
    marginBottom: SIZES.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.xs / 2,
  },

  // Item Selection
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: SIZES.md,
  },
  itemsList: {
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    paddingBottom: SIZES.md,
    marginBottom: SIZES.md,
    borderBottomWidth: 1,
  },
  itemLabel: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: SIZES.xs / 2,
  },
  itemMeta: {
    fontSize: SIZES.caption,
    marginBottom: SIZES.xs / 2,
  },
  itemPrice: {
    fontSize: SIZES.bodySmall,
    ...FONTS.semiBold,
  },
  itemControls: {
    alignItems: 'flex-end',
  },

  // Input Fields
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    paddingHorizontal: SIZES.md,
    marginBottom: SIZES.md,
  },
  inputIcon: {
    marginRight: SIZES.sm,
  },
  input: {
    flex: 1,
    paddingVertical: SIZES.md,
    fontSize: SIZES.body,
  },
  textArea: {
    paddingTop: SIZES.md,
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SIZES.md,
  },
  halfInput: {
    flex: 1,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
  },
  modalBody: {
    padding: SIZES.lg,
  },
  categorySection: {
    marginBottom: SIZES.lg,
  },
  categoryTitle: {
    fontSize: SIZES.h6,
    ...FONTS.bold,
    marginBottom: SIZES.sm,
  },
  itemOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    marginBottom: SIZES.xs,
  },
  itemOptionLabel: {
    fontSize: SIZES.body,
    ...FONTS.medium,
    marginBottom: SIZES.xs / 2,
  },
  itemOptionMeta: {
    fontSize: SIZES.caption,
  },
  
  // Custom Item Modal
  customItemModal: {
    width: '90%',
    padding: SIZES.xl,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.large,
  },
  customItemInput: {
    borderWidth: 1,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    fontSize: SIZES.body,
  },
  inputLabel: {
    fontSize: SIZES.caption,
    ...FONTS.medium,
  },
  sizeOption: {
    borderWidth: 1.5,
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    position: 'relative',
  },
  sizeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeOptionLabel: {
    fontSize: SIZES.body,
    ...FONTS.bold,
  },
  sizeOptionDesc: {
    fontSize: SIZES.caption,
    marginTop: 2,
  },
  sizeOptionPrice: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
  },
  customItemButtons: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  customItemButton: {
    flex: 1,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    alignItems: 'center',
  },

  // Picker Modal
  pickerModal: {
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.lg,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: SIZES.h5,
    ...FONTS.bold,
  },
  pickerOptions: {
    maxHeight: 400,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.lg,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: SIZES.body,
    ...FONTS.medium,
    flex: 1,
  },

  // Fixed Button
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    ...SHADOWS.large,
  },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.sm,
  },
  totalAmount: {
    fontSize: SIZES.h4,
    ...FONTS.bold,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: SIZES.radiusLg,
    gap: SIZES.sm,
    ...SHADOWS.medium,
  },
  continueButtonText: {
    fontSize: SIZES.h6,
    ...FONTS.bold,
  },
});
