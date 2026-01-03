// utils/api.js
import axios from 'axios';
import { API_BASE_URL } from './config';
import logger from './logger';

const API_BASE = `${API_BASE_URL}/api`;

// Fetch assignments for a driver (pickup or delivery)
export const fetchDriverAssignments = async (driverId, type) => {
  // type: 'pickup' or 'delivery'
  return axios.get(`${API_BASE}/shipments/driver/${driverId}?type=${type}`);
};

// Fetch latest alerts/messages for a driver
export const fetchDriverAlerts = async (driverId) => {
  return axios.get(`${API_BASE}/notifications/driver/${driverId}`);
};

export const submitCashReconciliation = async ({ driver_id, amount, photoUrl, token }) => {
  return axios.post(
    `${API_BASE}/cash-reconciliation`,
    { driverId: driver_id, amount, photoUrl },
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  );
};
