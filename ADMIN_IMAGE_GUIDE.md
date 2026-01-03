# Admin Product Image Guide

## How to Add Product Images to Grocery Shop

### Overview
The Mani Me admin dashboard allows you to add and edit grocery products with images. Images are displayed in both the admin panel and the mobile app.

### Adding Images to Products

#### 1. Using Image URLs (Recommended)
The admin interface accepts direct image URLs. You can use images from:

**Free Image Hosting Services:**
- **Imgur** (https://imgur.com) - Simple upload, right-click → Copy image address
- **ImgBB** (https://imgbb.com) - Free hosting, provides direct links
- **Cloudinary** (https://cloudinary.com) - Professional solution with free tier

**E-commerce Product Images:**
- Use direct links from supplier websites (ensure you have rights)
- Amazon product images (for reference only)
- Unsplash (https://unsplash.com) - High-quality free stock photos

#### 2. Steps to Add Image URL

1. **Access Grocery Shop Management**
   - Log into admin dashboard
   - Navigate to "Grocery Shop" from sidebar

2. **Add/Edit Product**
   - Click "Add New Item" or click Edit icon on existing product
   - Fill in product details (Name, Description, Price, Stock, etc.)

3. **Add Image URL**
   - Paste the direct image URL in the "Image URL" field
   - The image preview will show on the right side
   - Click "Save" to update

4. **Image URL Requirements**
   - Must be a direct link ending in .jpg, .jpeg, .png, or .webp
   - Example: `https://i.imgur.com/abc123.jpg`
   - NOT: `https://imgur.com/gallery/abc123` (gallery page)

#### 3. Image Guidelines

**Recommended Specifications:**
- **Format:** JPG, PNG, or WebP
- **Size:** 500x500px to 1000x1000px
- **Aspect Ratio:** Square (1:1) for best results
- **File Size:** Under 500KB for fast loading
- **Background:** White or transparent preferred

**Image Quality:**
- Clear, well-lit product photos
- Show product from front angle
- No watermarks or text overlays
- Consistent style across all products

### Example Workflow

#### Using Imgur:
1. Go to https://imgur.com
2. Click "New post" → Upload image
3. After upload, right-click image → "Copy image address"
4. Paste URL in admin form: `https://i.imgur.com/XYZ123.jpg`

#### Using ImgBB:
1. Go to https://imgbb.com
2. Click "Start uploading"
3. Copy the "Direct link" URL
4. Paste in admin form

### Testing Images

After adding an image URL:
1. Check the preview in the admin dialog
2. Save the product
3. Verify image appears in the product table (56x56 thumbnail)
4. Test in mobile app - open Grocery Shop screen
5. Image should display in the 2-column grid

### Troubleshooting

**Image Not Showing:**
- ✅ Verify URL is direct link (ends with .jpg, .png, etc.)
- ✅ Check URL in browser - should show only the image
- ✅ Ensure image is publicly accessible (not behind login)
- ✅ Try different image host if current one blocks hotlinking

**Image Displays in Admin but Not Mobile:**
- Check mobile app internet connection
- Verify URL doesn't require authentication
- Try refreshing mobile app

**Image Too Large/Slow:**
- Use image compression tools (TinyPNG, Squoosh)
- Resize to 800x800px maximum
- Convert to WebP format for smaller file size

### Future Enhancements
- Direct file upload from admin dashboard
- Image cropping/editing tools
- Bulk image upload
- Integration with cloud storage (AWS S3, Firebase Storage)

### Sample Image URLs (For Testing)

```
Rice: https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500
Oil: https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500
Sugar: https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=500
Flour: https://images.unsplash.com/photo-1628672361896-e96059bfeeb1?w=500
```

### Best Practices

1. **Consistency:** Use similar backgrounds/lighting for all products
2. **Quality:** High-resolution but optimized file sizes
3. **Accuracy:** Image should match actual product being sold
4. **Copyright:** Only use images you have rights to use
5. **Testing:** Always verify images display correctly in mobile app

### Support

For technical issues with image uploads, contact the development team or check the backend logs at:
```
mani-me-backend/src/logs/
```

---

**Last Updated:** December 27, 2025
**Version:** 1.0
