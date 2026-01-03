# Admin Dashboard Security Audit Report

**Date**: December 27, 2024  
**System**: Mani Me Admin Dashboard  
**Status**: 🟡 **MEDIUM RISK** - Requires Immediate Attention

---

## Executive Summary

The admin dashboard has **good foundational security** but contains **critical vulnerabilities** that require immediate fixes:

### 🔴 Critical Issues (Must Fix Immediately)
1. **Fallback JWT Secret** - Weak default secret in production
2. **Inconsistent Token Storage** - Mixed `token` vs `adminToken` keys
3. **No Admin Login Rate Limiting** - Vulnerable to brute force attacks
4. **CORS IP Address Hardcoded** - Won't work in production

### 🟡 Medium Priority Issues
5. **Token Expiry Too Long** - 24 hours is excessive
6. **No Session Management** - No ability to revoke admin sessions
7. **Password Reset Not Implemented** - Admin lockout risk

### 🟢 Good Security Practices (Already Implemented)
✅ **Bcrypt Password Hashing** - Properly implemented  
✅ **JWT Authentication** - Correctly validates tokens  
✅ **CORS Whitelist** - Restricts origins (needs production update)  
✅ **Helmet Security Headers** - Basic protection enabled  
✅ **Input Validation** - Password/email validation exists  
✅ **Rate Limiting** - Implemented for user auth (not admin)  
✅ **Admin-Only Endpoints** - verifyAdmin middleware protects routes  

---

## Detailed Findings

### 1. 🔴 CRITICAL: Weak JWT Secret Fallback

**Location**: `mani-me-backend/src/routes/admin.js:7`
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
```

**Risk Level**: 🔴 **CRITICAL**  
**Impact**: If JWT_SECRET environment variable is not set, system uses predictable default secret. Attackers can:
- Generate valid admin JWT tokens
- Bypass authentication completely
- Gain full admin access

**Current State**:
- ✅ `.env` file has strong secret: `4c8f3a7e9d2b1f6a5e8c7d3b9f2a4e6c...`
- ❌ Code has dangerous fallback

**Fix Required**: Remove fallback, throw error if JWT_SECRET not set

---

### 2. 🔴 CRITICAL: Inconsistent Token Storage

**Issue**: Admin dashboard uses TWO different localStorage keys:
- Some files use `localStorage.getItem('token')`
- Other files use `localStorage.getItem('adminToken')`

**Affected Files**:
- `api.js` uses `adminToken` ✅
- `UKDrivers.js` uses `token` ❌
- `GhanaDrivers.js` uses `token` ❌
- `GroceryShop.js` uses `token` ❌
- `ImageUpload.js` uses `token` ❌

**Impact**:
- API calls fail randomly
- Admin appears logged out intermittently
- Creates confusion and security gaps

**Fix Required**: Standardize on `adminToken` everywhere

---

### 3. 🔴 CRITICAL: No Admin Login Rate Limiting

**Issue**: Admin login endpoint has NO rate limiting
```javascript
router.post('/login', async (req, res) => {
  // NO RATE LIMITER HERE!
```

**Impact**: Attackers can:
- Brute force admin passwords
- Unlimited login attempts
- No IP blocking after failed attempts

**Current State**:
- ✅ User login has rate limiting (5 attempts/15 min)
- ❌ Admin login has ZERO protection

**Fix Required**: Add `adminLoginLimiter` with stricter limits (3 attempts/30 min)

---

### 4. 🟡 MEDIUM: Hardcoded IP Address in CORS

**Location**: `mani-me-backend/src/index.js:13`
```javascript
'http://192.168.1.181:3000', // Local network access
```

**Issue**: 
- IP address hardcoded
- Won't work in production
- Needs to be environment variable

**Fix Required**: Use `process.env.ADMIN_DASHBOARD_URL`

---

### 5. 🟡 MEDIUM: Token Expiry Too Long

**Location**: `mani-me-backend/src/routes/admin.js:56`
```javascript
{ expiresIn: '24h' }
```

**Issue**:
- 24 hours is excessive for admin access
- If token stolen, attacker has 24 hours of access
- Industry best practice: 1-2 hours for admin, 8 hours maximum

**Recommendation**: Change to `2h` or `4h`

---

### 6. 🟡 MEDIUM: No Session Revocation

**Issue**: Once admin JWT issued, cannot be revoked
- No logout endpoint on backend
- No token blacklist
- Compromised tokens remain valid until expiry

**Impact**:
- If admin device stolen, cannot invalidate session
- No way to force logout suspicious sessions
- Cannot implement "logout all devices" feature

**Recommendation**: Implement token blacklist or session store

---

### 7. 🟡 MEDIUM: No Password Reset for Admins

**Issue**: 
- No "Forgot Password" flow for admins
- If admin loses password, requires database access
- No self-service password reset

**Risk**: Admin lockout requires developer intervention

---

### 8. 🟢 LOW: Environment Variable Exposure

**Location**: `.env` file contains real credentials
```dotenv
ADMIN_EMAIL=admin@mani.com
ADMIN_PASSWORD=Dominion_3@
```

**Status**: ⚠️ **Acceptable if .env is in .gitignore**  
**Verify**: `.env` must NEVER be committed to Git

---

### 9. 🟢 LOW: MongoDB Connection String Exposed

**Issue**: MongoDB URI contains credentials in .env
```dotenv
MONGODB_URI=mongodb+srv://manimeadmin:dOminiOn_3POS@cluster0...
```

**Status**: ⚠️ **Normal for development**, but:
- Rotate password for production
- Use MongoDB Atlas IP whitelist
- Enable MongoDB audit logs

---

## Security Strengths (Well Implemented)

### ✅ Password Security
```javascript
// Strong bcrypt hashing (10 rounds)
const isValidPassword = await bcrypt.compare(password, adminUser.password);
```
- Passwords hashed with bcrypt ✅
- Salt rounds appropriate (10) ✅
- No plaintext passwords ✅

### ✅ Token Validation
```javascript
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded.isAdmin && decoded.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not authorized' });
  }
```
- Checks both `isAdmin` and `role` ✅
- Validates JWT signature ✅
- Returns 403 for unauthorized ✅

### ✅ CORS Protection
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://admin.manime.com',
  // ...
];
```
- Whitelist approach ✅
- Logs blocked requests ✅
- Credentials allowed for auth ✅

### ✅ Input Validation
```javascript
const validatePassword = (password) => {
  // Min 8 chars, uppercase, lowercase, number, special char
  // Blocks common passwords
};
```
- Strong password policy ✅
- Email validation ✅
- Sanitization functions exist ✅

### ✅ Helmet Security Headers
```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
```
- XSS protection ✅
- Clickjacking protection ✅
- MIME sniffing prevention ✅

---

## Attack Vectors & Mitigation

### Attack 1: Admin Password Brute Force
**Current State**: ❌ **VULNERABLE**  
**Attack**: Unlimited login attempts to /api/admin/login  
**Mitigation**: Add rate limiter (3 attempts/30 min)

### Attack 2: JWT Token Theft
**Current State**: 🟡 **MODERATE RISK**  
**Attack**: XSS steals token from localStorage  
**Mitigation**: 
- Token already expires (24h - should be shorter)
- Consider httpOnly cookies for more security

### Attack 3: Weak JWT Secret
**Current State**: 🟡 **VULNERABLE IF .ENV MISSING**  
**Attack**: If JWT_SECRET not set, use fallback to forge tokens  
**Mitigation**: Remove fallback, crash if not set

### Attack 4: CORS Bypass
**Current State**: ✅ **PROTECTED**  
**Attack**: Cross-origin requests from attacker domain  
**Mitigation**: Already blocked by whitelist

### Attack 5: SQL/NoSQL Injection
**Current State**: ✅ **PROTECTED**  
**Attack**: Inject malicious queries  
**Mitigation**: Mongoose parameterizes queries automatically

### Attack 6: Session Hijacking
**Current State**: 🟡 **MODERATE RISK**  
**Attack**: Steal valid token and impersonate admin  
**Mitigation**: 
- HTTPS required (production)
- Reduce token expiry
- Implement IP binding

---

## Compliance Check

### GDPR/Data Protection
- ✅ Passwords hashed (not stored plaintext)
- ✅ User data queries restricted by auth
- ⚠️ No audit logs for admin actions
- ⚠️ No data retention policy visible

### Industry Standards (OWASP Top 10)
1. **Broken Access Control**: 🟢 Protected (verifyAdmin middleware)
2. **Cryptographic Failures**: 🟢 Protected (bcrypt, JWT)
3. **Injection**: 🟢 Protected (Mongoose ORM)
4. **Insecure Design**: 🟡 Moderate (no rate limiting on admin login)
5. **Security Misconfiguration**: 🟡 Moderate (fallback secrets exist)
6. **Vulnerable Components**: ⚠️ Unknown (need npm audit)
7. **Authentication Failures**: 🔴 Vulnerable (no admin rate limiting)
8. **Software/Data Integrity**: 🟢 Protected
9. **Logging Failures**: 🟡 Moderate (no admin action logs)
10. **SSRF**: 🟢 Protected

**Overall Score**: 7/10 (Good, needs improvement)

---

## Immediate Action Items

### Priority 1 (Deploy Today):
1. ✅ Remove JWT_SECRET fallback in admin.js
2. ✅ Standardize token localStorage key to `adminToken`
3. ✅ Add admin login rate limiter (3 attempts/30 min)
4. ✅ Reduce token expiry to 2 hours

### Priority 2 (Deploy This Week):
5. ⏳ Move CORS origins to environment variables
6. ⏳ Add admin logout endpoint with token blacklist
7. ⏳ Implement admin password reset flow
8. ⏳ Add admin action audit logs

### Priority 3 (Next Sprint):
9. ⏳ Add "last login" tracking
10. ⏳ Implement 2FA for admin accounts
11. ⏳ Add email alerts for admin logins
12. ⏳ Session timeout with activity tracking

---

## Fixes Implementation

See: `ADMIN_SECURITY_FIXES.md` for complete code changes
See: `admin-security-fixes.ps1` for automated fix script

---

**Audited By**: GitHub Copilot  
**Next Review**: After Priority 1 fixes deployed  
**Contact**: Review ADMIN_SECURITY_FIXES.md for implementation details
