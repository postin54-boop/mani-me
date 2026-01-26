// trackingService.test.js
const trackingService = require('../services/trackingService');
const TrackingEvent = require('../models/trackingEvent');

jest.mock('../models/TrackingEvent');

describe('Tracking Service', () => {
  afterEach(() => jest.clearAllMocks());

  it('should add a tracking event', async () => {
    TrackingEvent.prototype.save = jest.fn().mockResolvedValue(true);
    const event = await trackingService.addTrackingEvent('PARCEL123', 'Picked Up', 'admin', 'note');
    expect(event.parcel_id).toBe('PARCEL123');
    expect(event.status).toBe('Picked Up');
    expect(event.actor).toBe('admin');
    expect(event.notes).toBe('note');
  });
});
