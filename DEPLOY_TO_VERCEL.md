# Deploy E2W Finance to Vercel

## ✅ Issue Fixed

The `vercel.json` file has been updated to work with Vercel's **free tier**. The cron configuration (for automatic recurring transactions) requires a Pro plan and has been removed.

## 📋 Pre-Deployment Checklist

- [x] Code pushed to GitHub
- [x] Vercel.json configured for free tier
- [x] All critical issues fixed
- [x] Database seeded with sample data
- [ ] Ready to deploy!

## 🚀 Deployment Steps

### Step 1: Sign Up/Login to Vercel

1. Go to https://vercel.com
2. Sign up or login with your GitHub account
3. Authorize Vercel to access your GitHub repositories

### Step 2: Import Your Repository

1. Click **"Add New..."** → **"Project"**
2. Find and select **"E2W-Finance-Management"** from your repositories
3. Click **"Import"**

### Step 3: Configure Project Settings

**Framework Preset:** Next.js (should auto-detect)

**Build Command:** `npm run build` (should auto-detect)

**Output Directory:** `.next` (should auto-detect)

**Install Command:** `npm install` (should auto-detect)

### Step 4: Set Environment Variables

Click **"Environment Variables"** and add these:

#### Required Variables:

```env
DATABASE_URL
Value: file:./prisma/dev.db
```

```env
NEXTAUTH_URL
Value: https://your-app-name.vercel.app
(You'll get the actual URL after deployment, use placeholder for now)
```

```env
NEXTAUTH_SECRET
Value: (Generate a random string - see below)
```

```env
ADMIN_PASSWORD_HASH
Value: $2b$10$MkSKpdKvvz7mhhORJRLVNedNvZy/YBcXEWorw4iFF2b9T4eZmNeo6
(This is the hash for "admin123")
```

**To generate NEXTAUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use an online generator: https://generate-secret.vercel.app/32

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-3 minutes)
3. You'll get a deployment URL like: `https://e2w-finance-management.vercel.app`

### Step 6: Update NEXTAUTH_URL

1. Copy your actual deployment URL
2. Go to **Settings** → **Environment Variables**
3. Update `NEXTAUTH_URL` with your actual URL
4. Redeploy (Vercel → Deployments → Click "..." → Redeploy)

## 🗄️ Database Options

### Option 1: SQLite (Current - Development Only)

**Pros:**
- No setup required
- Works immediately
- Free

**Cons:**
- ⚠️ Data is lost on every deployment
- Not recommended for production
- Limited to single instance

**Note:** Vercel's serverless functions are stateless, so SQLite won't persist data between deployments.

### Option 2: Vercel Postgres (Recommended for Production)

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **"Create Database"** → **"Postgres"**
3. Choose your plan (Hobby plan is free for small projects)
4. Vercel will automatically add `DATABASE_URL` to your environment variables
5. Run migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Option 3: Supabase (Free Alternative)

1. Sign up at https://supabase.com
2. Create a new project
3. Get your PostgreSQL connection string from Settings → Database
4. Update `DATABASE_URL` in Vercel
5. Run migrations as above

### Option 4: Railway (Another Free Option)

1. Sign up at https://railway.app
2. Create a new PostgreSQL database
3. Copy connection string
4. Update `DATABASE_URL` in Vercel
5. Run migrations as above

## 🔄 Recurring Transactions

### Manual Trigger (Current Setup)

Since cron jobs require Vercel Pro, you can manually generate recurring transactions:

1. Go to `/recurring` page in your deployed app
2. Click **"Generate Now"** button
3. This will create transactions from all active templates

### Automatic Trigger (Vercel Pro Only)

If you upgrade to Vercel Pro:

1. Replace `vercel.json` with `vercel.json.pro`
2. This will run the cron job daily at midnight
3. Recurring transactions will be generated automatically

## 🔐 Security Checklist

Before going to production:

- [ ] Change the default admin password
- [ ] Update `ADMIN_PASSWORD_HASH` with new password hash
- [ ] Ensure `NEXTAUTH_SECRET` is a strong random string
- [ ] Never commit `.env` file (it's in .gitignore)
- [ ] Use a production database (not SQLite)
- [ ] Enable 2FA on your Vercel account
- [ ] Set up custom domain (optional)

## 🎨 Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update `NEXTAUTH_URL` to your custom domain
5. Redeploy

## 🐛 Troubleshooting

### Build Fails

**Check these:**
- All dependencies in `package.json` are correct
- No TypeScript errors (run `npm run build` locally first)
- Environment variables are set correctly

### Login Doesn't Work

**Check:**
- `NEXTAUTH_URL` matches your actual deployment URL (no trailing slash)
- `NEXTAUTH_SECRET` is set
- `ADMIN_PASSWORD_HASH` is correct

### Database Connection Issues

**Check:**
- `DATABASE_URL` is correct format
- Database server is accessible
- Migrations have been run

### Invoices Don't Generate

**Check:**
- Logo files are in `public/images/`
- `pdf-lib` is installed
- No console errors in browser

## 📊 Monitoring

### Vercel Analytics (Free)

1. Go to **Analytics** tab in Vercel dashboard
2. View page views, unique visitors, top pages

### Vercel Logs

1. Go to **Deployments** → Select deployment → **Function Logs**
2. View real-time logs and errors

## 💰 Cost Breakdown

### Free Tier (Hobby)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (100GB-Hrs)
- ✅ Analytics
- ❌ No cron jobs
- ❌ No team members

### Pro Tier ($20/month)
- ✅ Everything in Hobby
- ✅ Cron jobs (automatic recurring transactions)
- ✅ More bandwidth (1TB)
- ✅ Team members
- ✅ Password protection

## 🎯 Post-Deployment

After successful deployment:

1. **Test thoroughly:**
   - Login functionality
   - Create/edit/delete transactions
   - Generate invoices
   - Test recurring templates
   - Download bulk invoices

2. **Import your data:**
   - Export from Excel to JSON
   - Run seed script with your data
   - Verify all imported correctly

3. **Set up categories:**
   - Customize expense/income categories
   - Set up exchange rates

4. **Create recurring templates:**
   - Monthly salaries
   - Subscriptions
   - Any other recurring expenses/income

5. **Share with your team!**

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Check browser console for errors
3. Review this deployment guide
4. Check `ISSUES_FIXED.md` for common problems
5. Refer to `SETUP.md` for detailed documentation

## 🎉 Success!

Once deployed, you'll have:
- ✅ Professional financial management system
- ✅ Accessible from anywhere
- ✅ Automatic HTTPS
- ✅ Fast global CDN
- ✅ Zero server maintenance

**Default Login:**
- Email: admin@e2w.com
- Password: admin123

**⚠️ Remember to change the default password after first login!**

---

Need help? Check the documentation:
- `SETUP.md` - Complete feature guide
- `ISSUES_FIXED.md` - All bugs and fixes
- `README.md` - Quick start guide
