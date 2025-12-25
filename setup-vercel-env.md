# Vercel Environment Variables Setup

## Required Environment Variables

You need to set the following environment variables in Vercel for deployment:

### 1. DATABASE_URL (PostgreSQL from Neon)
```bash
# This is your Neon PostgreSQL connection string
# Format: postgresql://username:password@host/database
vercel env add DATABASE_URL
```
**Value**: Your Neon PostgreSQL connection string (already in local .env)

### 2. NEXTAUTH_URL
```bash
# Your production URL
vercel env add NEXTAUTH_URL
```
**Value**: `https://your-vercel-domain.vercel.app`
(Will be provided after first deployment)

### 3. NEXTAUTH_SECRET
```bash
# Generate a random secret for NextAuth
vercel env add NEXTAUTH_SECRET
```
**Value**: Generate with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. ADMIN_PASSWORD_HASH
```bash
# Your admin password hash
vercel env add ADMIN_PASSWORD_HASH
```
**Value**: Your bcrypt password hash (from local .env)

---

## Quick Setup Script

Run these commands in order:

```bash
# 1. DATABASE_URL (use your Neon PostgreSQL URL)
vercel env add DATABASE_URL production

# 2. NEXTAUTH_SECRET (generate new one for production)
vercel env add NEXTAUTH_SECRET production

# 3. ADMIN_PASSWORD_HASH (use existing hash from .env)
vercel env add ADMIN_PASSWORD_HASH production

# 4. NEXTAUTH_URL (set after first deployment)
# Leave this for after initial deployment
```

---

## After Setting Environment Variables

Deploy to Vercel:
```bash
vercel --prod
```

Then update NEXTAUTH_URL:
```bash
# After deployment, set the NEXTAUTH_URL to your actual domain
vercel env add NEXTAUTH_URL production
# Enter: https://your-actual-domain.vercel.app

# Redeploy to apply the change
vercel --prod
```

---

## Verification

After deployment, verify:
1. ✅ Database connection works
2. ✅ Authentication works
3. ✅ All API endpoints return proper responses
4. ✅ Prisma Client is generated correctly

---

## Notes

- All environment variables are set to "production" environment
- DATABASE_URL should point to your Neon PostgreSQL database (NOT the local SQLite)
- NEXTAUTH_URL must match your actual Vercel domain
- NEXTAUTH_SECRET must be kept secret and never committed to git
