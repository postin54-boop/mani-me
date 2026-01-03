import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, StatusBar, Image, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors, SIZES, SHADOWS, FONTS } from '../constants/theme';
import { BOX_TYPES, ITEM_CATEGORIES } from '../constants/bookingData';

export default function BookingScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();

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
  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

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

  // Time slots (24 hours, 1-hour intervals)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const start = i.toString().padStart(2, '0') + ':00';
    const end = ((i + 1) % 24).toString().padStart(2, '0') + ':00';
    return `${start} - ${end}`;
  });

  // ========================================
  // BOX MODE FUNCTIONS
  // ========================================

  const addBox = (boxId) => {
    const existingBox = selectedBoxes.find(b => b.boxId === boxId);
    const boxData = BOX_TYPES.find(b => b.id === boxId);
    
    if (existingBox) {
      // Increment quantity
      setSelectedBoxes(selectedBoxes.map(b => 
        b.boxId === boxId 
          ? { ...b, quantity: b.quantity + 1, totalPrice: boxData.basePrice * (b.quantity + 1) }
          : b
      ));
    } else {
      // Add new box
      setSelectedBoxes([...selectedBoxes, {
        boxId,
        label: boxData.label,
        quantity: 1,
        unitPrice: boxData.basePrice,
        totalPrice: boxData.basePrice,
      }]);
    }
  };

  const updateBoxQuantity = (boxId, newQuantity) => {
    if (newQuantity < 1) {
      removeBox(boxId);
      return;
    }
    const boxData = BOX_TYPES.find(b => b.id === boxId);
    setSelectedBoxes(selectedBoxes.map(b => 
      b.boxId === boxId 
        ? { ...b, quantity: newQuantity, totalPrice: boxData.basePrice * newQuantity }
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
    if (item.requiresInput && !customItemName.trim()) {
      Alert.alert('Custom Item Name Required', 'Please enter a name for this item');
      return;
    }

    const newItem = {
      id: Date.now(),
      categoryId,
      itemId: item.id,
      label: item.label,
      customName: item.requiresInput ? customItemName.trim() : null,
      quantity: 1,
      unitPrice: item.basePrice,
      totalPrice: item.basePrice,
      size: item.size,
      estimatedWeight: item.estimatedWeight,
    };

    setSelectedItems([...selectedItems, newItem]);
    setCustomItemName('');
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
              <Text style={[styles.sectionTitle, { color: colors.primary, textAlign: 'center', marginBottom: SIZES.lg }]}>
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
          {/* STEP 2: SENDER DETAILS (ALWAYS SHOWN AFTER MODE SELECTION) */}
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
                
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="home-outline" size={20} color={colors.primary} style={styles.inputIcon} />
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
                      {pickupDate || 'Select Date *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.inputWrapper, styles.halfInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons name="time-outline" size={24} color={colors.accent} style={styles.inputIcon} />
                <Text style={[styles.input, { color: pickupTime ? colors.text : colors.textSecondary }]}>
                  {pickupTime || 'Select Time *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Parcel Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cube" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.primary, fontWeight: '700' }]}>Items to Ship</Text>
            </View>

            {/* Added Items List */}
            {items.length > 0 && (
              <View style={[styles.itemsList, { backgroundColor: colors.primary }]}> 
                <Text style={[styles.itemsHeader, { color: colors.text }]}>
                  {items.length} item{items.length > 1 ? 's' : ''} added
                </Text>
                {items.map((item, index) => (
                  <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.itemContent}>
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemType, { color: colors.text }]}>{index + 1}. {item.parcelType}</Text>
                        {item.description ? (
                          <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.description}
                          </Text>
                        ) : null}
                        {item.estimatedPrice ? (
                          <Text style={[styles.itemPrice, { color: colors.secondary }]}>£{item.estimatedPrice}</Text>
                        ) : null}
                        {item.images.length > 0 && (
                          <Text style={[styles.itemImages, { color: colors.textSecondary }]}>
                            📷 {item.images.length} photo{item.images.length > 1 ? 's' : ''}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeItemButton}>
                        <View style={styles.removeItemButtonPremium}>
                          <Ionicons name="trash-outline" size={20} color="#EF4444" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
            
            {/* Add New Item Form */}
            <View style={[styles.addItemForm, { backgroundColor: colors.surface }]}>
              <Text style={[styles.addItemTitle, { color: colors.primary, fontWeight: '700', fontSize: SIZES.h4, letterSpacing: 0.2 }]}> 
                {items.length === 0 ? 'Add Your First Item' : 'Add Another Item'}
              </Text>

              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="pricetag-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.primary, fontSize: SIZES.bodySmall, fontWeight: '600', marginBottom: 2, letterSpacing: 0.2 }}>Item Category *</Text>
                  <TouchableOpacity
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: SIZES.radiusSm,
                      backgroundColor: colors.surface,
                      padding: SIZES.sm,
                      marginBottom: SIZES.sm,
                    }}
                    onPress={() => setShowCategoryModal(true)}
                  >
                    <Text style={{ color: currentItem.parcelType ? colors.text : colors.textSecondary, fontWeight: '500', fontSize: SIZES.body }}>
                      {currentItem.parcelType || 'Select category...'}
                    </Text>
                  </TouchableOpacity>
                  {/* Quantity Selector */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm }}>
                    <Text style={{ color: colors.primary, fontSize: SIZES.bodySmall, fontWeight: '600', marginRight: SIZES.sm }}>Quantity</Text>
                    <TouchableOpacity onPress={() => setCurrentItem({ ...currentItem, quantity: Math.max(1, (currentItem.quantity || 1) - 1) })} style={{ padding: 8 }}>
                      <Ionicons name="remove-circle-outline" size={SIZES.iconMd} color={colors.secondary} />
                    </TouchableOpacity>
                    <Text style={{ color: colors.text, fontSize: SIZES.body, marginHorizontal: SIZES.sm }}>{currentItem.quantity || 1}</Text>
                    <TouchableOpacity onPress={() => setCurrentItem({ ...currentItem, quantity: (currentItem.quantity || 1) + 1 })} style={{ padding: 8 }}>
                      <Ionicons name="add-circle-outline" size={SIZES.iconMd} color={colors.secondary} />
                    </TouchableOpacity>
                  </View>
                  {/* Size Selector */}
                  <Text style={{ color: colors.primary, fontSize: SIZES.bodySmall, fontWeight: '600', marginBottom: 2 }}>Size</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.sm }}>
                    {['Small', 'Medium', 'Large', 'Extra Large'].map((size) => (
                      <TouchableOpacity
                        key={size}
                        onPress={() => !currentItem.autoSize && setCurrentItem({ ...currentItem, size })}
                        style={{
                          backgroundColor: currentItem.size === size ? colors.secondary : colors.surface,
                          borderColor: colors.border,
                          borderWidth: 1,
                          borderRadius: SIZES.radiusSm,
                          paddingHorizontal: SIZES.sm,
                          paddingVertical: 4,
                          marginRight: SIZES.xs,
                          opacity: currentItem.autoSize ? 0.5 : 1,
                        }}
                        disabled={currentItem.autoSize}
                      >
                        <Text style={{ color: currentItem.size === size ? colors.primary : colors.text, fontSize: SIZES.bodySmall, fontWeight: currentItem.size === size ? '700' : '500' }}>{size}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                    {/* Item Category Modal */}
                    <ItemCategoryModal
                      visible={showCategoryModal}
                      onClose={() => setShowCategoryModal(false)}
                      categories={ITEM_CATEGORIES}
                      onSelect={(item) => {
                        setCurrentItem((prev) => ({
                          ...prev,
                          parcelType: item.label,
                          size: item.size || '',
                          autoSize: !!item.size,
                          declaredWeight: item.weight ? String(item.weight) : '',
                          autoWeight: item.weight || null,
                        }));
                        setShowCategoryModal(false);
                      }}
                    />
              </View>
              
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.surface, borderRadius: SIZES.radiusSm, fontSize: SIZES.body, fontWeight: '500' }]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.textSecondary}
                  value={currentItem.description}
                  onChangeText={(text) => setCurrentItem({ ...currentItem, description: text })}
                  multiline
                  numberOfLines={3}
                />
                {/* Add Photo Button */}
                <TouchableOpacity 
                  style={styles.addPhotoButton}
                  onPress={() => setShowImageMenu(true)}
                >
                  <Ionicons name="camera-outline" size={20} color={colors.secondary} />
                </TouchableOpacity>
              </View>

              {/* Image Preview */}
              {currentItem.images.length > 0 && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={[styles.imageCountText, { color: colors.textSecondary }]}>
                    {currentItem.images.length} photo{currentItem.images.length > 1 ? 's' : ''} added
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                    {currentItem.images.map((uri, index) => (
                      <View key={index} style={styles.imagePreviewWrapper}>
                        <Image source={{ uri }} style={styles.imagePreview} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={24} color="#FF5252" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              

              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                <Ionicons name="scale-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Declared Weight (kg) — optional"
                  placeholderTextColor={colors.textSecondary}
                  value={currentItem.declaredWeight}
                  onChangeText={(text) => setCurrentItem({ ...currentItem, declaredWeight: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}> 
                <Ionicons name="cash-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Estimated Price (£)"
                    placeholderTextColor={colors.textSecondary}
                    value={currentItem.estimatedPrice}
                    editable={false}
                  />
              </View>


            </View>
            
            {/* Special Instructions */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: SIZES.md }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.secondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text }]}
                placeholder="Special Instructions (applies to all items)"
                placeholderTextColor={colors.textSecondary}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Image Menu Modal */}
      <Modal
        visible={showImageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageMenu(false)}
        >
          <View style={[styles.imageMenuContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              style={[styles.imageMenuItem, { borderBottomColor: colors.border }]}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={24} color={colors.secondary} />
              <Text style={[styles.imageMenuText, { color: colors.text }]}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.imageMenuItem}
              onPress={pickImage}
            >
              <Ionicons name="images" size={24} color={colors.secondary} />
              <Text style={[styles.imageMenuText, { color: colors.text }]}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Date Picker Modal */}
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

      {/* Time Picker Modal */}
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
      
      {/* Fixed Continue Button at Bottom */}
      <View style={[styles.fixedButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.continueButtonPremium, { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]} 
            onPress={handleContinue}
            activeOpacity={0.93}
            disabled={isContinueDisabled}
          >
            <Ionicons name="arrow-forward-circle" size={SIZES.iconLg} color={colors.accent} style={{ marginRight: SIZES.sm }} />
            <Text style={[styles.continueButtonTextPremium, { color: colors.accent }]}>Continue to Receiver Details</Text>
          </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  selector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
  },
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
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.md,
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
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
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
    minHeight: 60,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  addPhotoButton: {
    padding: SIZES.sm,
    position: 'absolute',
    right: SIZES.md,
    top: SIZES.md,
  },
  imagePreviewContainer: {
    marginTop: SIZES.sm,
    marginBottom: SIZES.md,
  },
  imageCountText: {
    fontSize: SIZES.small,
    ...FONTS.medium,
    marginBottom: SIZES.sm,
    marginLeft: SIZES.xs,
  },
  imageScrollView: {
    marginLeft: SIZES.xs,
  },
  imagePreviewWrapper: {
    marginRight: SIZES.md,
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radiusSm,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  itemsList: {
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  itemsHeader: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: SIZES.sm,
  },
  itemCard: {
    borderRadius: SIZES.radiusSm,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: SIZES.md,
  },
  itemType: {
    fontSize: SIZES.body,
    ...FONTS.semiBold,
    marginBottom: SIZES.xs / 2,
  },
  itemDescription: {
    fontSize: SIZES.bodySmall,
    marginBottom: SIZES.xs / 2,
  },
  itemPrice: {
    fontSize: SIZES.body,
    ...FONTS.bold,
    marginTop: SIZES.xs / 2,
  },
  itemImages: {
    fontSize: SIZES.small,
    marginTop: SIZES.xs / 2,
  },
  removeItemButtonPremium: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addItemForm: {
    borderRadius: SIZES.radiusMd,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    ...SHADOWS.small,
  },
  addItemTitle: {
    fontSize: SIZES.h6,
    ...FONTS.semiBold,
    marginBottom: SIZES.md,
  },
  addItemButtonPremium: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
    marginHorizontal: 0,
    ...SHADOWS.small,
  },
  addItemButtonTextPremium: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
  },
  imageMenuContainer: {
    borderRadius: SIZES.radiusMd,
    width: '100%',
    maxWidth: 300,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  imageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.lg,
    gap: SIZES.md,
    borderBottomWidth: 1,
  },
  imageMenuText: {
    fontSize: SIZES.h6,
    ...FONTS.medium,
  },
  pickerModal: {
    borderRadius: SIZES.radiusLg,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
    ...SHADOWS.large,
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
  fixedButtonContainer: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    borderTopWidth: 1,
    ...SHADOWS.medium,
  },
  continueButtonPremium: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 0,
    marginVertical: 8,
    ...SHADOWS.medium,
  },
  continueButtonTextPremium: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginRight: 0,
  },
});
