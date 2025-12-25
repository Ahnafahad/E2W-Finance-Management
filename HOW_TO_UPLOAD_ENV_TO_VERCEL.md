# How to Upload Environment Variables to Vercel

## 📁 File Created: `.env.vercel`

Your production environment variables are ready in `.env.vercel`

---

## 🎯 Method 1: Upload via Vercel Dashboard (Recommended)

This is the easiest and most visual method.

### Steps:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/ahnaf-ahads-projects/e2w-finance
   - Click on **Settings** tab

2. **Navigate to Environment Variables**
   - Click **Environment Variables** in the left sidebar

3. **Add Each Variable**

   Open `.env.vercel` file and add each variable one by one:

   **Variable 1: DATABASE_URL**
   - Name: `DATABASE_URL`
   - Value: `postgresql://neondb_owner:npg_qJMTbadD5m4s@ep-frosty-surf-a43gvarz.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - Environment: Select **Production**
   - Click **Save**

   **Variable 2: NEXTAUTH_URL**
   - Name: `NEXTAUTH_URL`
   - Value: `https://e2wfinancemanagement.vercel.app`
   - Environment: Select **Production**
   - Click **Save**

   **Variable 3: NEXTAUTH_SECRET**
   - Name: `NEXTAUTH_SECRET`
   - Value: `Nzn603GhTsVFIjuI33kwf4miucxz50ax6Sh6j9DnBT4=`
   - Environment: Select **Production**
   - Click **Save**

   **Variable 4: ADMIN_PASSWORD_HASH**
   - Name: `ADMIN_PASSWORD_HASH`
   - Value: `$2b$10$MkSKpdKvvz7mhhORJRLVNedNvZy/YBcXEWorw4iFF2b9T4eZmNeo6`
   - Environment: Select **Production**
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋮** menu on the latest deployment
   - Click **Redeploy**
   - OR run: `vercel --prod` from terminal

---

## 🎯 Method 2: Upload via Vercel CLI (One by One)

Use this if you prefer command line:

```bash
# Make sure you're in the project directory
cd "D:\E2W Expenses\e2w-finance"

# 1. DATABASE_URL
echo 'postgresql://neondb_owner:npg_qJMTbadD5m4s@ep-frosty-surf-a43gvarz.us-east-1.aws.neon.tech/neondb?sslmode=require' | vercel env add DATABASE_URL production

# 2. NEXTAUTH_URL
echo 'https://e2wfinancemanagement.vercel.app' | vercel env add NEXTAUTH_URL production

# 3. NEXTAUTH_SECRET
echo 'Nzn603GhTsVFIjuI33kwf4miucxz50ax6Sh6j9DnBT4=' | vercel env add NEXTAUTH_SECRET production

# 4. ADMIN_PASSWORD_HASH
echo '$2b$10$MkSKpdKvvz7mhhORJRLVNedNvZy/YBcXEWorw4iFF2b9T4eZmNeo6' | vercel env add ADMIN_PASSWORD_HASH production

# Then redeploy
vercel --prod
```

---

## 🎯 Method 3: Bulk Upload Script (Automated)

For bash/git bash users:

```bash
# Make the script executable
chmod +x upload-env-to-vercel.sh

# Run the script
bash upload-env-to-vercel.sh

# Then redeploy
vercel --prod
```

---

## 🎯 Method 4: Manual Copy-Paste (Windows)

### Using PowerShell:

```powershell
# 1. DATABASE_URL
$env:DATABASE_URL = "postgresql://neondb_owner:npg_qJMTbadD5m4s@ep-frosty-surf-a43gvarz.us-east-1.aws.neon.tech/neondb?sslmode=require"
vercel env add DATABASE_URL production
# When prompted, paste the value

# 2. NEXTAUTH_URL
vercel env add NEXTAUTH_URL production
# Enter: https://e2wfinancemanagement.vercel.app

# 3. NEXTAUTH_SECRET
vercel env add NEXTAUTH_SECRET production
# Enter: Nzn603GhTsVFIjuI33kwf4miucxz50ax6Sh6j9DnBT4=

# 4. ADMIN_PASSWORD_HASH
vercel env add ADMIN_PASSWORD_HASH production
# Enter: $2b$10$MkSKpdKvvz7mhhORJRLVNedNvZy/YBcXEWorw4iFF2b9T4eZmNeo6

# Redeploy
vercel --prod
```

---

## ✅ Verify Environment Variables

After uploading, verify they're set:

### Via Dashboard:
1. Go to https://vercel.com/ahnaf-ahads-projects/e2w-finance/settings/environment-variables
2. You should see all 4 variables listed

### Via CLI:
```bash
vercel env ls
```

---

## 🔄 After Setting Environment Variables

**IMPORTANT**: You must redeploy for changes to take effect!

```bash
vercel --prod
```

Or click **Redeploy** in the Vercel dashboard.

---

## 🧪 Test After Deployment

1. **Visit your app**: https://e2wfinancemanagement.vercel.app

2. **Test login**:
   - Email: `admin@e2w.com`
   - Password: `admin123`

3. **Test API**:
   - Try creating a transaction
   - Should work with authentication

---

## 🔐 Security Notes

1. **Never commit `.env.vercel` to git**
   - It contains sensitive credentials
   - Already in `.gitignore`

2. **Change default password**
   - Default password is `admin123`
   - Generate new hash:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_NEW_PASSWORD', 10).then(console.log)"
   ```
   - Update `ADMIN_PASSWORD_HASH` in Vercel

3. **Custom domain**
   - If you add a custom domain, update `NEXTAUTH_URL`

---

## 📋 Environment Variables Summary

| Variable | Purpose | Current Value |
|----------|---------|---------------|
| `DATABASE_URL` | PostgreSQL connection | Neon PostgreSQL |
| `NEXTAUTH_URL` | App URL for auth | https://e2wfinancemanagement.vercel.app |
| `NEXTAUTH_SECRET` | JWT encryption key | Generated secure key |
| `ADMIN_PASSWORD_HASH` | Admin password | Bcrypt hash of "admin123" |

---

## ❓ Troubleshooting

### Environment variables not working?
- Make sure you selected "Production" environment
- Redeploy after adding variables
- Check Vercel deployment logs for errors

### Authentication not working?
- Verify `NEXTAUTH_URL` matches your actual domain
- Check `NEXTAUTH_SECRET` is set correctly
- Clear browser cookies and try again

### Database connection failing?
- Verify `DATABASE_URL` is correct
- Check Neon PostgreSQL is running
- Review deployment logs

---

## 🎉 You're Done!

Once environment variables are uploaded and you've redeployed:

✅ Authentication will work
✅ Database will connect
✅ All features will be functional
✅ Production ready!

**Test your app**: https://e2wfinancemanagement.vercel.app
