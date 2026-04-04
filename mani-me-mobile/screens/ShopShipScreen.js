import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../constants/theme';
import api from '../src/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ShopShipScreen({ navigation }) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shippingBoxes, setShippingBoxes] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [categoriesRes, featuredRes, boxesRes] = await Promise.all([
        api.get('/shop-ship/categories'),
        api.get('/shop-ship/featured?limit=6'),
        api.get('/shop-ship/boxes'),
      ]);
      
      setCategories(categoriesRes.data || []);
      setFeaturedProducts(featuredRes.data || []);
      setShippingBoxes(boxesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async (category = null, search = '') => {
    try {
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;
      
      const response = await api.get('/shop-ship/products', { params });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedCategory || searchQuery) {
      fetchProducts(selectedCategory, searchQuery);
    }
  }, [selectedCategory, searchQuery, fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    if (selectedCategory) {
      await fetchProducts(selectedCategory);
    }
    setRefreshing(false);
  };

  const categoryIcons = {
    electronics: 'phone-portrait',
    kitchen: 'restaurant',
    baby: 'balloon',
    food: 'nutrition',
    household: 'home',
    clothing: 'shirt',
    health: 'medkit',
    beauty: 'sparkles',
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        { 
          backgroundColor: selectedCategory === item.id ? item.color + '20' : colors.surface,
          borderColor: selectedCategory === item.id ? item.color : colors.border,
        }
      ]}
      onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
    >
      <Ionicons 
        name={categoryIcons[item.id] || 'cube'} 
        size={24} 
        color={item.color || colors.primary} 
      />
      <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
        {item.count} items
      </Text>
    </TouchableOpacity>
  );

  const renderProductCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('ShopShipProduct', { product: item })}
    >
      <Image
        source={{ uri: item.thumbnail || item.images?.[0] }}
        style={styles.productImage}
        resizeMode="cover"
      />
      {item.original_price && item.original_price > item.price && (
        <View style={styles.saleBadge}>
          <Text style={styles.saleBadgeText}>
            {Math.round((1 - item.price / item.original_price) * 100)}% OFF
          </Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            £{item.price.toFixed(2)}
          </Text>
          {item.original_price && item.original_price > item.price && (
            <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
              £{item.original_price.toFixed(2)}
            </Text>
          )}
        </View>
        <Text style={[styles.retailer, { color: colors.textSecondary }]}>
          via {item.retailer}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
        <Text style={styles.heroTitle}>Shop & Ship</Text>
        <Text style={styles.heroSubtitle}>
          Shop from UK retailers, we deliver to Ghana
        </Text>
        <View style={styles.heroFeatures}>
          <View style={styles.heroFeature}>
            <Ionicons name="cube-outline" size={20} color="#fff" />
            <Text style={styles.heroFeatureText}>Box pricing</Text>
          </View>
          <View style={styles.heroFeature}>
            <Ionicons name="airplane-outline" size={20} color="#fff" />
            <Text style={styles.heroFeatureText}>Free consolidation</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Shipping Info */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.boxesContainer}
        contentContainerStyle={styles.boxesContent}
      >
        {shippingBoxes.map((box) => (
          <View 
            key={box.size} 
            style={[styles.boxCard, { backgroundColor: box.color + '15', borderColor: box.color }]}
          >
            <Ionicons name={box.icon} size={24} color={box.color} />
            <Text style={[styles.boxName, { color: colors.text }]}>{box.name}</Text>
            <Text style={[styles.boxWeight, { color: colors.textSecondary }]}>
              Up to {box.max_weight_kg}kg
            </Text>
            <Text style={[styles.boxPrice, { color: box.color }]}>
              £{box.price_gbp} shipping
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
      </View>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      />

      {/* Featured or Products */}
      {!selectedCategory && !searchQuery ? (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ShopShip')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Search Results'}
          </Text>
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
            {products.length} items
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayProducts = selectedCategory || searchQuery ? products : featuredProducts;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={displayProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No products found
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  heroSection: {
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  heroFeatures: {
    flexDirection: 'row',
    gap: 20,
  },
  heroFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroFeatureText: {
    color: '#fff',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  boxesContainer: {
    marginBottom: 8,
  },
  boxesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  boxCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    width: 120,
    marginRight: 12,
  },
  boxName: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  boxWeight: {
    fontSize: 11,
    marginTop: 2,
  },
  boxPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 14,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    width: 90,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 10,
    marginTop: 2,
  },
  productRow: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#f5f5f5',
  },
  saleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  retailer: {
    fontSize: 11,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
});
