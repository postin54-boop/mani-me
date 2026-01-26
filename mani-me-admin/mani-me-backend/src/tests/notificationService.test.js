// notificationService.test.js
const notificationService = require('../services/notificationService');
const Notification = require('../models/notification');

jest.mock('../models/notification');

describe('Notification Service', () => {
  afterEach(() => jest.clearAllMocks());

  it('should create a notification', async () => {
    Notification.prototype.save = jest.fn().mockResolvedValue(true);
    const notification = await notificationService.createNotification({ user_id: 'USER123', type: 'info', message: 'Test' });
    expect(notification.user_id).toBe('USER123');
    expect(notification.type).toBe('info');
    expect(notification.message).toBe('Test');
  });
});
