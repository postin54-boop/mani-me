jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../utils/jobQueue', () => ({
  addJob: jest.fn().mockResolvedValue({ queued: true, jobId: 'test-job' }),
  createQueue: jest.fn(() => {}),
  registerProcessor: jest.fn(() => {}),
  QUEUE_NAMES: {
    NOTIFICATIONS: 'notifications',
  },
}));

jest.mock('expo-server-sdk', () => {
  const Expo = jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([{ status: 'ok' }]),
  }));

  Expo.isExpoPushToken = jest.fn((token) =>
    typeof token === 'string' && token.startsWith('ExponentPushToken[')
  );

  return { Expo };
});

const { Expo } = require('expo-server-sdk');
const notificationService = require('../services/notificationService');

describe('Notification Service', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns null for invalid Expo push token', async () => {
    const result = await notificationService.sendPushNotification(
      'invalid-token',
      'Test',
      'Body',
      { type: 'test' }
    );

    expect(result).toBeNull();
    expect(Expo.isExpoPushToken).toHaveBeenCalledWith('invalid-token');
  });

  it('sends notification for valid Expo token', async () => {
    const pushToken = 'ExponentPushToken[test-token-123]';

    const result = await notificationService.sendPushNotification(
      pushToken,
      'New Update',
      'Parcel status changed',
      { type: 'shipment_update' }
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result[0].status).toBe('ok');
  });
});
