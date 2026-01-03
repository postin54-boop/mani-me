// parcelService.test.js
const parcelService = require('../services/parcelService');
const ParcelItem = require('../models/parcelItem');

jest.mock('../models/ParcelItem');

describe('Parcel Service', () => {
  afterEach(() => jest.clearAllMocks());

  it('should create a parcel item with hierarchical ID', async () => {
    const bookingId = 'MM-UK-2409-000123';
    const itemType = 'Box';
    const itemLetter = 'A';
    ParcelItem.prototype.save = jest.fn().mockResolvedValue(true);
    const parcel = await parcelService.createParcelItem(bookingId, itemType, itemLetter, {});
    expect(parcel.id).toBe(`${bookingId}-${itemLetter}`);
    expect(parcel.booking_id).toBe(bookingId);
    expect(parcel.item_type).toBe(itemType);
  });
});
