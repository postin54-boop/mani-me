# Mani Me Website

Official website for **manimeapp.com** - UK to Ghana Parcel Delivery Service.

## 📂 Structure

```
mani-me-website/
├── index.html          # Homepage
├── about.html          # About Us
├── services.html       # Our Services
├── contact.html        # Contact Us
├── privacy.html        # Privacy Policy
├── terms.html          # Terms & Conditions
├── data-protection.html # Data Protection Policy
├── cookies.html        # Cookie Policy
├── styles.css          # All styling
├── script.js           # JavaScript (menu, animations, cookies)
├── favicon.svg         # Site favicon
├── robots.txt          # Search engine directives
├── sitemap.xml         # SEO sitemap
├── vercel.json         # Vercel deployment config
├── netlify.toml        # Netlify deployment config
└── images/
    ├── hero-illustration.svg
    ├── app-mockup.svg
    ├── app-store.svg
    └── google-play.svg
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd mani-me-website
   vercel
   ```

3. For production:
   ```bash
   vercel --prod
   ```

4. Configure custom domain in Vercel dashboard:
   - Go to Project Settings → Domains
   - Add `manimeapp.com`
   - Update DNS records as instructed

### Option 2: Netlify

1. **Drag & Drop**: Go to [netlify.com/drop](https://netlify.com/drop) and drag the `mani-me-website` folder

2. **Or use CLI**:
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod --dir=.
   ```

3. Configure custom domain in Netlify dashboard:
   - Go to Domain Settings
   - Add custom domain `manimeapp.com`
   - Update DNS records

### Option 3: GitHub Pages

1. Create a new repository on GitHub

2. Push the website:
   ```bash
   cd mani-me-website
   git init
   git add .
   git commit -m "Initial website"
   git remote add origin https://github.com/YOUR_USERNAME/manimeapp-website.git
   git push -u origin main
   ```

3. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Select branch: `main`
   - Folder: `/ (root)`

4. Configure custom domain:
   - Add `manimeapp.com` in GitHub Pages settings
   - Update DNS records

## 🌐 DNS Configuration

For any hosting provider, you'll need to configure DNS records:

### For root domain (manimeapp.com):

| Type | Name | Value |
|------|------|-------|
| A | @ | [IP from hosting provider] |
| CNAME | www | manimeapp.com |

### Or for CNAME setup:

| Type | Name | Value |
|------|------|-------|
| CNAME | @ | [your-site].vercel.app |
| CNAME | www | [your-site].vercel.app |

## ✏️ Customization

### Update Contact Info
Edit these files if contact details change:
- `index.html` (footer & contact section)
- `contact.html`
- `privacy.html`
- `terms.html`
- All footer sections

### Update Pricing
Edit `services.html` to update box prices and shipping options.

### Add Real App Store Links
Update links in:
- `index.html` (download section)
- All footers

## 📱 Testing Locally

Simply open `index.html` in a browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 🔒 Security Headers

Both Vercel and Netlify configs include security headers:
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff

## 📊 SEO

- `robots.txt` - Allows all crawlers
- `sitemap.xml` - Lists all pages for search engines
- Meta descriptions on all pages
- Semantic HTML structure

---

**Domain**: manimeapp.com  
**Support**: support@manimeapp.com  
**Phone**: +44 7958 086887
