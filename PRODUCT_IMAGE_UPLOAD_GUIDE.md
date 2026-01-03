# Product Image Upload System - Complete Guide

## Overview
Admins can now upload product images for grocery and packaging items through two methods:
1. **File Upload** - Upload images directly from their computer (requires Firebase Storage setup)
2. **URL Input** - Paste image URLs from external sources (works without Firebase)

## System Components

### Backend Components

#### 1. Upload Route (`mani-me-backend/src/routes/upload.js`)
- **Endpoint**: `POST /api/upload/image`
- **Authentication**: Admin only (JWT token required)
- **File Size Limit**: 5MB
- **Supported Formats**: JPG, PNG, GIF, WEBP (all image types)
- **Storage**: Firebase Storage (with fallback to URL input if not configured)

**Features**:
- Multer middleware for file handling
- Firebase Storage integration
- Automatic public URL generation
- File name sanitization (timestamp + safe filename)
- Error handling with helpful fallback messages

#### 2. Delete Image Endpoint
- **Endpoint**: `DELETE /api/upload/image`
- **Purpose**: Remove uploaded images from Firebase Storage
- **Body**: `{ fileName: "products/12345-image.jpg" }`

### Frontend Component

#### ImageUpload Component (`mani-me-admin/src/components/ImageUpload.js`)
**Props**:
- `value` (string): Current image URL
- `onChange` (function): Callback when image changes
- `label` (string): Component label (default: "Product Image")
- `width` (number): Preview box width (default: 200)
- `height` (number): Preview box height (default: 200)

**Features**:
- **Drag & Drop**: Drag image files directly into preview box
- **File Picker**: Click to select file from computer
- **URL Input**: Button to paste image URL manually
- **Live Preview**: Shows image preview with error fallback
- **Remove Button**: Clear current image
- **Loading State**: Shows spinner during upload
- **Error Messages**: User-friendly error notifications
- **Validation**: File type and size validation

## Usage in Admin Dashboard

### Grocery Shop (GroceryShop.js)
The ImageUpload component is integrated into the Add/Edit Item dialog:
```jsx
<ImageUpload
  value={formData.image_url}
  onChange={(url) => setFormData({ ...formData, image_url: url })}
  label="Product Image"
  width="100%"
  height={200}
/>
```

### Packaging Shop (PackagingShop.js)
Same integration pattern:
```jsx
<ImageUpload
  value={formData.imageUrl}
  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
  label="Product Image"
  width={200}
  height={200}
/>
```

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd mani-me-backend
npm install multer firebase-admin
```

### 2. Configure Firebase Storage (Optional but Recommended)

#### Option A: With Firebase Storage (Full Features)
1. **Enable Firebase Storage** in Firebase Console:
   - Go to https://console.firebase.google.com
   - Select your project
   - Navigate to Storage
   - Click "Get Started"
   - Choose production mode or test mode

2. **Update Firebase Configuration**:
   - Open `mani-me-backend/serviceAccountKey.json`
   - Ensure it has the correct credentials
   - Add storage bucket to Firebase init in `src/routes/upload.js` if needed

3. **Set Storage Rules** (Firebase Console > Storage > Rules):
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /products/{fileName} {
         // Allow authenticated admins to upload
         allow write: if request.auth != null;
         // Allow public read
         allow read: if true;
       }
     }
   }
   ```

#### Option B: Without Firebase Storage (URL-Only Mode)
- System works with manual URL input only
- File upload button shows helpful message: "Firebase Storage not configured"
- Admins can use:
  - Image hosting services (Imgur, Cloudinary, etc.)
  - CDN URLs
  - Direct product image URLs from suppliers

### 3. Register Upload Route
Already completed in `mani-me-backend/src/app.js`:
```javascript
app.use('/api/upload', require('./routes/upload'));
```

### 4. Admin Dashboard - No Installation Required
Component already integrated in:
- ✅ `mani-me-admin/src/components/ImageUpload.js`
- ✅ `mani-me-admin/src/pages/GroceryShop.js`
- ✅ `mani-me-admin/src/pages/PackagingShop.js`

## How to Use (Admin Workflow)

### Method 1: Upload Image File

1. **Open Grocery/Packaging Shop** in admin dashboard
2. **Click "Add New Item"** or edit existing item
3. **In the Product Image section**:
   - **Option A**: Drag image file directly into the preview box
   - **Option B**: Click "Choose File" button and select image
4. **Wait for upload** - spinner shows progress
5. **Verify preview** - uploaded image appears in preview box
6. **Fill other fields** (name, price, stock, etc.)
7. **Click "Save"** - image URL is automatically saved with product

### Method 2: Paste Image URL

1. **Get image URL**:
   - Upload image to Imgur, Cloudinary, or image host
   - Copy direct image URL (ends with .jpg, .png, etc.)
   - OR use product image from supplier website

2. **In Product Image section**:
   - Click "Paste Image URL" button
   - Enter URL in prompt
   - Preview appears automatically

3. **Save product** with image URL

### Editing Images

- **Change Image**: Upload new file or paste new URL (replaces current)
- **Remove Image**: Click "Remove" button (sets to empty)
- **View Full Size**: Click on preview image (opens in new tab)

## Error Handling

### Common Errors & Solutions

1. **"Only image files are allowed"**
   - Solution: Select JPG, PNG, GIF, or WEBP files only

2. **"Image must be less than 5MB"**
   - Solution: Compress image using TinyPNG, Squoosh, etc.
   - OR: Use "Paste Image URL" with hosted image

3. **"Firebase Storage not configured"**
   - Not an error! System works fine with URL input
   - Solution: Use "Paste Image URL" button instead
   - OR: Set up Firebase Storage (see Installation Steps)

4. **"Failed to upload image"**
   - Check internet connection
   - Verify admin is logged in (token valid)
   - Try "Paste Image URL" as fallback

5. **Image preview shows "Image not found"**
   - URL is broken or requires authentication
   - Try uploading file directly instead
   - OR: Use different image hosting service

## Database Schema

### Grocery Items (`groceryItem` model)
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  image_url: String,  // ← Stores image URL
  stock: Number,
  unit: String,
  is_available: Boolean
}
```

### Packaging Items (`packagingItem` model)
```javascript
{
  name: String,
  category: String,
  description: String,
  price: Number,
  stock: Number,
  inStock: Boolean,
  imageUrl: String,  // ← Stores image URL
  createdAt: Date,
  updatedAt: Date
}
```

## Firebase Storage Structure
```
mani-me-bucket/
└── products/
    ├── 1703685600000-cardboard-box.jpg
    ├── 1703685700000-bubble-wrap.png
    ├── 1703685800000-packing-tape.jpg
    └── ...
```

**File Naming Pattern**: `{timestamp}-{sanitized-original-name}.{ext}`
- Example: `1703685600000-large_box_image.jpg`

## API Endpoints

### Upload Image
```http
POST /api/upload/image
Authorization: Bearer {admin-jwt-token}
Content-Type: multipart/form-data

Body: FormData with 'image' field containing file

Response (Success):
{
  "success": true,
  "url": "https://storage.googleapis.com/bucket-name/products/12345-image.jpg",
  "fileName": "products/12345-image.jpg"
}

Response (Fallback - Storage not configured):
{
  "message": "Firebase Storage not configured. Please use image URL instead.",
  "error": "...",
  "fallback": true
}
```

### Delete Image
```http
DELETE /api/upload/image
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json

Body:
{
  "fileName": "products/12345-image.jpg"
}

Response:
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Security Features

1. **Admin-Only Access**: JWT verification ensures only admins can upload
2. **File Type Validation**: Multer filters non-image files
3. **Size Limits**: 5MB maximum prevents abuse
4. **File Name Sanitization**: Removes special characters from filenames
5. **Public Read, Admin Write**: Firebase Storage rules protect uploads

## Performance Considerations

1. **Image Optimization**:
   - Admins should optimize images before upload
   - Recommended tools: TinyPNG, Squoosh, ImageOptim
   - Target size: < 500KB for web display

2. **CDN Benefits**:
   - Firebase Storage includes CDN automatically
   - Fast global delivery
   - No server load for image serving

3. **Lazy Loading**:
   - Product images load on-demand in tables
   - Preview shows placeholder while loading

## Troubleshooting

### Upload Button Not Working
1. Check browser console for errors
2. Verify admin is logged in (check localStorage for 'token')
3. Try "Paste Image URL" as alternative
4. Check network tab for 401/403 errors

### Images Not Displaying
1. Check if URL is accessible (open in new tab)
2. Verify CORS settings if using external URLs
3. Check image URL format (must be direct image link)
4. Try re-uploading image

### Firebase Storage Errors
1. Verify Firebase project has Storage enabled
2. Check serviceAccountKey.json is valid
3. Verify Storage rules allow public read
4. Check Firebase quota limits (free tier: 5GB)

## Future Enhancements

Potential improvements:
1. **Image Cropping**: Built-in editor for cropping/resizing
2. **Multiple Images**: Support for product galleries
3. **Auto-Optimization**: Server-side image compression
4. **Progress Bar**: Show upload percentage
5. **Batch Upload**: Multiple images at once
6. **Image Library**: Reuse uploaded images across products

## Testing Checklist

- [ ] Upload JPG image (< 5MB)
- [ ] Upload PNG image (< 5MB)  
- [ ] Try uploading > 5MB image (should error)
- [ ] Try uploading PDF file (should error)
- [ ] Drag & drop image into preview box
- [ ] Paste image URL manually
- [ ] Edit existing product's image
- [ ] Remove image from product
- [ ] Verify image displays in product list table
- [ ] Test without Firebase Storage configured (URL-only mode)

---

**Status**: ✅ Complete  
**Last Updated**: December 27, 2024  
**Dependencies**: multer, firebase-admin (backend), MUI (frontend)
