import api from '../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchRecentParcels = async () => {
  try {
    // Get user ID from AsyncStorage
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) {
      console.log('No user found in storage');
      return [];
    }

    const user = JSON.parse(userStr);
    const userId = user.id || user._id;

    if (!userId) {
      console.log('No user ID found');
      return [];
    }

    // Fetch recent shipments from backend
    const response = await api.get(`/shipments/recent/${userId}`);
    
    if (response.data && response.data.shipments) {
      // Transform backend data to match frontend expectations
      return response.data.shipments.map(shipment => ({
        _id: shipment._id,
        tracking_number: shipment.tracking_number,
        recipientName: shipment.receiver_name || 'Unknown Recipient',
        status: shipment.status || 'pending',
        warehouse_status: shipment.warehouse_status,
        createdAt: shipment.createdAt
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching recent parcels:', error.message);
    // Return empty array on error instead of crashing
    return [];
  }
};
