# Mani Me - Brand & UX Implementation Guide

## 🎨 Brand Colors

### Primary Palette
- **Navy Blue** `#0B1A33` - Trust, professionalism, reliability
- **Sky Blue** `#83C5FA` - Friendliness, accessibility, modern
- **White** `#FFFFFF` - Clean, minimal, spacious

### Color Usage
- **Light Mode**: Navy blue as primary, sky blue as accents
- **Dark Mode**: Sky blue as primary, navy blue as background

## 🌓 Dark Mode Strategy

The app automatically switches based on device settings:
```javascript
import { useThemeColors } from '../constants/theme';

// In any component:
const { colors, isDark } = useThemeColors();
```

### Light Mode Colors
- Background: `#F9FAFB` (soft gray)
- Surface: `#FFFFFF` (white)
- Text: `#0B1A33` (navy)
- Primary: `#0B1A33` (navy)
- Secondary: `#83C5FA` (sky blue)

### Dark Mode Colors
- Background: `#0B1A33` (navy)
- Surface: `#152847` (dark navy)
- Text: `#FFFFFF` (white)
- Primary: `#83C5FA` (sky blue)
- Secondary: `#0B1A33` (navy)

## 🎯 Design Philosophy: Uber-Style Minimal Flat

### Key Principles
1. **Clean & Simple** - Remove unnecessary elements
2. **Flat Design** - Minimal shadows, no gradients (except backgrounds)
3. **Clear Hierarchy** - Typography and spacing create structure
4. **Generous Whitespace** - Let content breathe
5. **Purposeful Color** - Use brand colors intentionally
6. **Micro-animations** - Subtle, fast, meaningful

### Typography Scale
```
H1: 34px - Page titles
H2: 28px - Section headers
H3: 24px - Card titles
H4: 20px - Subsection headers
Body: 16px - Main content
Small: 14px - Secondary text
Caption: 12px - Labels, hints
```

### Spacing (8px Grid System)
```
XS: 4px   - Tight spacing
SM: 8px   - Small gaps
MD: 16px  - Standard spacing
LG: 24px  - Section spacing
XL: 32px  - Large sections
XXL: 48px - Page margins
```

### Border Radius
```
SM: 8px   - Small elements
MD: 12px  - Buttons, inputs
LG: 16px  - Cards
XL: 24px  - Large containers
```

## 📱 Component Patterns

### Buttons
```javascript
// Primary Button
<TouchableOpacity style={{
  backgroundColor: colors.primary,
  height: 56,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
}}>
  <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '600' }}>
    Button Text
  </Text>
</TouchableOpacity>

// Secondary Button (Outline)
<TouchableOpacity style={{
  backgroundColor: 'transparent',
  borderWidth: 1.5,
  borderColor: colors.border,
  height: 56,
  borderRadius: 12,
  justifyContent: 'center',
  alignItems: 'center',
}}>
  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
    Button Text
  </Text>
</TouchableOpacity>
```

### Input Fields
```javascript
<View style={{
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 12,
  paddingHorizontal: 16,
  height: 56,
}}>
  <Ionicons name="icon-name" size={20} color={colors.textSecondary} />
  <TextInput
    style={{
      flex: 1,
      fontSize: 16,
      marginLeft: 8,
      color: colors.text,
    }}
    placeholder="Placeholder"
    placeholderTextColor={colors.textLight}
  />
</View>
```

### Cards
```javascript
<View style={{
  backgroundColor: colors.surface,
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
}}>
  {/* Card content */}
</View>
```

### Status Badges
```javascript
// Success
<View style={{
  backgroundColor: '#10B98110', // 10% opacity
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
}}>
  <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>
    Delivered
  </Text>
</View>

// Pending
<View style={{
  backgroundColor: '#F59E0B10',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
}}>
  <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '600' }}>
    Pending
  </Text>
</View>
```

## 🎭 Iconography

Use **Ionicons** from `@expo/vector-icons`:

### Common Icons
```javascript
import { Ionicons } from '@expo/vector-icons';

// Navigation
<Ionicons name="home" size={24} color={colors.primary} />
<Ionicons name="list" size={24} color={colors.primary} />
<Ionicons name="person" size={24} color={colors.primary} />

// Actions
<Ionicons name="add-circle" size={24} color={colors.primary} />
<Ionicons name="search" size={24} color={colors.textSecondary} />
<Ionicons name="filter" size={24} color={colors.textSecondary} />

// Status
<Ionicons name="checkmark-circle" size={24} color="#10B981" />
<Ionicons name="time" size={24} color="#F59E0B" />
<Ionicons name="close-circle" size={24} color="#EF4444" />

// Delivery
<Ionicons name="cube" size={24} color={colors.secondary} />
<Ionicons name="location" size={24} color={colors.secondary} />
<Ionicons name="car-sport" size={24} color={colors.primary} />
```

## 🎬 Animations

Use subtle, fast animations (200-300ms):

```javascript
import { Animated } from 'react-native';

const fadeAnim = useRef(new Animated.Value(0)).current;

Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();
```

## 📋 Screen Layouts

### Home Screen
- Gradient header with welcome message
- Quick action cards (New Booking, Track Order)
- Recent orders section
- Bottom tab navigation

### Orders Screen
- Search bar at top
- Filter/sort options
- Order cards with status badges
- Pull to refresh
- Empty state illustration

### Booking Screen
- Progress indicator (steps)
- Form sections with clear labels
- Icon-enhanced inputs
- Sticky submit button

### Profile Screen
- User info card at top
- Menu list items with icons
- Clear action buttons
- Logout at bottom

## 🚀 Next Steps

1. **Logo Integration**
   - Place logo in `assets/logo.png`
   - Use in login header and splash screen
   - Size: 512x512px minimum

2. **Illustrations**
   - Empty states (no orders, no connection)
   - Success states (order placed, delivered)
   - Error states
   - Onboarding slides

3. **Launch Screen**
   - Configure app.json splash screen
   - Use navy blue background
   - Center logo with fade-in animation

4. **Testing**
   - Test on iOS and Android
   - Verify dark mode transitions
   - Check accessibility (contrast ratios)
   - Test with different font sizes

## 📱 Platform Considerations

### iOS
- Use native blur effects
- Safe area insets
- Haptic feedback
- iOS-style modals

### Android
- Material ripple effects
- Status bar color
- Navigation bar color
- Back button handling

## ♿ Accessibility

- Minimum touch target: 44x44pt
- Text contrast ratio: 4.5:1 minimum
- Screen reader support
- Keyboard navigation
- Reduced motion option

## 📊 Performance

- Lazy load images
- Optimize re-renders (React.memo)
- Use FlatList for long lists
- Cache network requests
- Optimize bundle size

---

**Brand Consistency Checklist:**
- ✅ Navy blue (#0B1A33) as primary
- ✅ Sky blue (#83C5FA) as secondary
- ✅ White as accent
- ✅ Dark mode support
- ✅ Minimal flat design
- ✅ 8px spacing grid
- ✅ Consistent typography
- ✅ Ionicons throughout
- ⏳ Logo integration
- ⏳ Illustrations
- ⏳ Splash screen
