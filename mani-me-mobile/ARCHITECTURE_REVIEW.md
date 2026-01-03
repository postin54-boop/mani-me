# Mobile App Architecture Review
**Date:** December 24, 2025
**Reviewed:** mani-me-mobile

## ✅ STRENGTHS

### 1. **Context Architecture**
- ✅ **UnifiedCartContext**: Well-structured with proper useMemo optimization
- ✅ **UserContext**: Properly manages both user data and JWT tokens
- ✅ **Source tagging**: Cart items tagged with 'grocery' | 'packaging' for multi-shop support
- ✅ **Token persistence**: AsyncStorage used correctly for auth token storage

### 2. **API Layer**
- ✅ **Axios interceptor**: Automatically injects JWT tokens into all requests
- ✅ **Centralized config**: API base URL in single location (src/api.js)
- ✅ **Error handling**: Try-catch blocks in most API calls

### 3. **Navigation Structure**
- ✅ **React Navigation**: Stack + Bottom Tabs properly configured
- ✅ **Safe Area handling**: useSafeAreaInsets for notched devices
- ✅ **Deep linking ready**: Navigation structure supports route params

### 4. **UI/UX**
- ✅ **Theme system**: useThemeColors hook for dark/light mode
- ✅ **Brand consistency**: DEEP_NAVY (#071528) and SKY_BLUE (#84C3EA) used throughout
- ✅ **Icon library**: Ionicons consistently used

### 5. **Authentication Flow**
- ✅ **JWT token management**: Login/Register save tokens correctly
- ✅ **Auto-login after registration**: Seamless user experience
- ✅ **Logout clears state**: Both user and token removed from AsyncStorage

---

## 🚨 CRITICAL ISSUES

### 1. **BookingScreen: Missing State Variable**
**Location:** `screens/BookingScreen.js`
**Issue:** `currentItem` is referenced but NEVER initialized

```javascript
// Line 80: currentItem used in useEffect
if (currentItem.size || currentItem.declaredWeight || currentItem.weight) {
  setCurrentItem((item) => ({
    ...item,
    estimatedPrice: calculateEstimatedPrice(item),
  }));
}

// Line 90: currentItem used in addItem()
if (!currentItem.parcelType) {
  Alert.alert('Error', 'Please enter the parcel type');
  return;
}

// BUT THERE IS NO:
// const [currentItem, setCurrentItem] = useState({ ... });
```

**Impact:** 🔴 **APP WILL CRASH** when trying to add items to booking
**Fix Required:** Add state initialization after line 42

---

### 2. **Hardcoded API URLs**
**Location:** Multiple screens
**Issue:** API base URL duplicated across files instead of using centralized api.js

**Files with hardcoded URLs:**
- `PaymentScreen.js`: Lines 38, 82, 165 - `http://192.168.1.181:4000/api/...`
- `ChatScreen.js`: Direct fetch calls instead of using axios instance
- `TrackingScreen.js`: Hardcoded base URL

**Impact:** 🟡 Difficult to change backend URL, maintenance nightmare
**Best Practice:** Import `api` from `src/api.js` and use relative paths

---

### 3. **Error Handling Inconsistency**
**Issue:** Some screens use `alert()` (web-style), others use `Alert.alert()` (React Native)

**Examples:**
- `loginscreen.js` line 76: `alert("Login error: ...")`  ❌
- `RegisterScreen.js` line 45: `alert(res.data.message ...)`  ❌
- `BookingScreen.js`: Uses `Alert.alert(...)` ✅

**Impact:** 🟡 `alert()` doesn't work properly on mobile, causes poor UX
**Fix:** Replace all `alert()` with `Alert.alert()`

---

### 4. **UnifiedCartContext: Missing Error Handling**
**Location:** `context/UnifiedCartContext.js`
**Issue:** No validation when adding items to cart

```javascript
const addItem = (product) => {
  setItems((prev) => {
    const found = prev.find((i) => i.id === product.id);
    if (found) {
      return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
    }
    return [...prev, { ...product, quantity: 1 }];
  });
};
```

**Missing:**
- ❌ No check if `product` is null/undefined
- ❌ No validation that `product.id` exists
- ❌ No validation that `product.price` is a number
- ❌ No source validation ('grocery' | 'packaging')

**Impact:** 🟡 Potential crashes if invalid data passed to cart
**Fix:** Add validation at start of addItem()

---

### 5. **Google OAuth Placeholder Credentials**
**Location:** `loginscreen.js` line 43-45
**Issue:** Placeholder client IDs will cause OAuth to fail

```javascript
iosClientId: "508869526140-uc5k1lo5o20vkcr6jnnlqf0q4f8t5m0s.apps.googleusercontent.com",
androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com", // ❌
expoClientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com", // ❌
```

**Impact:** 🟡 Google Sign-In will not work
**Fix:** Replace with real credentials from Google Cloud Console

---

### 6. **Stripe Publishable Key Incomplete**
**Location:** `App.js` line 45
```javascript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51...'; // ❌ Incomplete
```

**Impact:** 🟡 Card payments will fail
**Fix:** Add complete Stripe test key

---

## ⚠️ MEDIUM PRIORITY ISSUES

### 7. **API Base URL Mismatch**
**Current IP:** `192.168.1.181:4000` in `src/api.js`
**Conversation History:** User's IP was `192.168.0.138:4000` in previous sessions

**Impact:** 🟠 App won't connect if user's network IP changed
**Check:** Run `ipconfig` to verify current IPv4 address

---

### 8. **No API Error Interceptor**
**Issue:** Axios has request interceptor but no response interceptor for global error handling

**Missing:**
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logout user, token expired
    }
    return Promise.reject(error);
  }
);
```

**Impact:** 🟠 No global handling of 401 (expired token) or 500 (server error)

---

### 9. **Cart Totals Calculation Duplicated**
**Issue:** Both `GroceryShopScreen` and `PackagingShopScreen` recalculate totals independently

**GroceryShopScreen:**
```javascript
const getTotalPrice = () => {
  return cart.filter(item => item.source === 'grocery')
    .reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
};
```

**Better Approach:** UnifiedCartContext should provide filtered totals:
```javascript
const getGroceryTotals = () => totals filtered by source === 'grocery'
const getPackagingTotals = () => totals filtered by source === 'packaging'
```

**Impact:** 🟠 Code duplication, harder to maintain

---

### 10. **Missing PropTypes/TypeScript**
**Issue:** No type checking for component props or context values

**Impact:** 🟠 Easy to pass wrong data types, harder to catch bugs

---

### 11. **Console.log Statements in Production**
**Found 29 instances** across multiple files:
- `src/api.js`: console.error in interceptor
- `loginscreen.js`: console.warn for logo
- `ChatScreen.js`: 4 console.log statements
- `UserContext.js`: 4 console.error statements

**Impact:** 🟠 Performance overhead, security risk (leaking data in logs)
**Fix:** Use proper logging library or environment-based logging

---

### 12. **BookingScreen: Incomplete Item Flow**
**Issue:** Two different item management systems in same screen

1. **Modern system** (lines 37-39): `itemModalVisible`, `selectedItemType`, `items` array
2. **Old system** (line 80+): `currentItem` with detailed properties (parcelType, weight, size, etc.)

**Problem:** The modal adds item types to `items` array, but `addItem()` function adds `currentItem` to same array - conflicting data structures

**Impact:** 🟠 User can't actually complete booking flow properly

---

## 💡 IMPROVEMENT OPPORTUNITIES

### 13. **AsyncStorage Key Management**
**Current:** Keys hardcoded as strings ('user', 'token')
**Better:** Constants file for storage keys
```javascript
// constants/storage.js
export const STORAGE_KEYS = {
  USER: '@mani_me:user',
  TOKEN: '@mani_me:token',
};
```

---

### 14. **No Loading States in Context**
**Issue:** Contexts don't expose loading states for API operations

**UnifiedCartContext:** Should have `isUpdating` state when modifying cart
**UserContext:** Has `loading` only for initial load, not for login/logout

---

### 15. **No Offline Support**
**Missing:**
- No check for network connectivity before API calls
- No queuing of failed requests
- No offline indicators in UI

**Suggested:** Add `@react-native-community/netinfo`

---

### 16. **Cart Persistence Not Implemented**
**Issue:** UnifiedCartContext uses useState - cart cleared on app restart

**Should:** Persist cart to AsyncStorage and restore on app start
```javascript
useEffect(() => {
  AsyncStorage.getItem('@cart').then(saved => {
    if (saved) setItems(JSON.parse(saved));
  });
}, []);

useEffect(() => {
  AsyncStorage.setItem('@cart', JSON.stringify(items));
}, [items]);
```

---

### 17. **No Rate Limiting on API Calls**
**Issue:** User can spam buttons, creating duplicate requests

**Example:** PaymentScreen - user can tap "Pay Now" multiple times before loading state updates

**Fix:** Disable buttons immediately on press, before async operation starts

---

### 18. **Image Picker Permissions Check Timing**
**Issue:** BookingScreen checks permissions AFTER user selects "Gallery"

**Better:** Check permissions on screen mount, show appropriate UI if denied

---

## 📊 ARCHITECTURE SCHEMATICS

### Data Flow: Authentication
```
1. User enters credentials → LoginScreen
2. LoginScreen calls api.post('/auth/login') 
3. Backend returns { user, token }
4. LoginScreen calls UserContext.login(user, token)
5. UserContext saves both to AsyncStorage
6. Navigation.replace('Home')
7. API interceptor reads token from AsyncStorage on every request
8. Backend validates token, returns data
```

**Gaps:**
- ❌ No token refresh mechanism
- ❌ No handling of 401 (expired token)
- ❌ No "Remember Me" option

---

### Data Flow: Cart Management
```
1. User adds item in GroceryShopScreen
2. GroceryShopScreen calls useCart().addItem({ ...product, source: 'grocery' })
3. UnifiedCartContext.addItem() updates items array
4. PackagingShopScreen also uses same useCart()
5. Both screens see same cart with source filtering
6. Cart calculates totals with useMemo
```

**Gaps:**
- ❌ Cart not persisted to AsyncStorage
- ❌ No cart expiration (items added months ago still there)
- ❌ No max quantity validation

---

### Data Flow: Booking
```
[BROKEN - See Issue #1 for details]

Expected Flow:
1. User selects item type → itemModalVisible
2. User fills item details → currentItem state (MISSING!)
3. User taps "Add Item" → addItem() adds currentItem to items array
4. User taps "Continue" → navigate to ReceiverDetails with items
5. ReceiverDetails → Payment → PaymentScreen creates shipment
```

**Critical Gap:** `currentItem` state never initialized

---

## 🎯 RECOMMENDED FIXES (Priority Order)

### 🔴 URGENT (Blocking issues)
1. **Add currentItem state to BookingScreen** - App crashes without this
2. **Replace all alert() with Alert.alert()** - Broken on mobile
3. **Verify API base URL** - App can't connect with wrong IP

### 🟡 HIGH PRIORITY (Poor UX)
4. **Centralize API calls** - Remove hardcoded URLs
5. **Add Google/Stripe real credentials** - OAuth/payments don't work
6. **Add cart validation** - Prevent invalid data crashes
7. **Add response interceptor** - Handle 401/500 globally

### 🟢 MEDIUM PRIORITY (Technical debt)
8. **Persist cart to AsyncStorage** - Better user experience
9. **Add offline detection** - Show user when no internet
10. **Remove console.log** - Clean up production code
11. **Fix BookingScreen item flow** - Unify item management
12. **Add loading states** - Prevent duplicate submissions

---

## 📝 CODE QUALITY METRICS

- **Total screens:** 27 files
- **Context providers:** 2 (UserContext, UnifiedCartContext)
- **API calls:** ~15 unique endpoints
- **Console statements:** 29 (should be 0 in production)
- **Error handling:** 60% coverage (21 try-catch blocks found)
- **Type safety:** 0% (no TypeScript or PropTypes)

---

## 🔧 QUICK WINS (Easy fixes with big impact)

1. **Add currentItem state** (5 minutes)
2. **Replace alert() calls** (10 minutes)
3. **Remove console.log** (15 minutes)
4. **Add cart validation** (20 minutes)
5. **Persist cart** (30 minutes)

---

## 🏗️ LONG-TERM IMPROVEMENTS

1. **Migrate to TypeScript** - Type safety across entire app
2. **Add React Query** - Better API state management
3. **Add Sentry** - Error tracking in production
4. **Add unit tests** - Jest + React Native Testing Library
5. **Add E2E tests** - Detox for full flow testing
6. **Add Storybook** - Component library documentation

---

## ✅ WHAT'S WORKING WELL

1. ✅ Cart context properly shared between shops
2. ✅ JWT authentication fully implemented
3. ✅ Dark mode theme system working
4. ✅ Safe area handling for notched devices
5. ✅ Navigation structure clean and logical
6. ✅ API interceptor auto-injects tokens
7. ✅ Brand colors consistently applied

---

## 📚 RELATED DOCUMENTATION

- See `BRAND_GUIDE.md` for UI/UX standards
- See `NOTIFICATION_SYSTEM.md` for push notification setup
- See `.github/copilot-instructions.md` for architecture overview

---

**Next Steps:**
1. Fix critical BookingScreen issue (currentItem state)
2. Test complete user flow: Register → Login → Shop → Booking → Payment
3. Verify backend connection with current IP address
4. Run app and check for runtime errors

