# Automatic Invoice Generation Setup Guide

This guide explains how to set up automatic recurring invoice generation using Vercel Cron Jobs.

## Overview

The system now includes an automatic cron job that runs daily at 2:00 AM UTC to generate recurring invoices. This eliminates the need to manually click "Generate Now" for recurring templates.

## What Was Implemented

### 1. Cron Endpoint
- **File**: `src/app/api/cron/generate-recurring-invoices/route.ts`
- **Purpose**: API endpoint that generates invoices from active recurring templates
- **Security**: Protected by `CRON_SECRET` environment variable
- **Schedule**: Runs daily at 2:00 AM UTC

### 2. Vercel Cron Configuration
- **File**: `vercel.json`
- **Configuration**:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/generate-recurring-invoices",
        "schedule": "0 2 * * *"
      }
    ]
  }
  ```

## How It Works

1. **Daily Execution**: Every day at 2:00 AM UTC, Vercel automatically calls the cron endpoint
2. **Template Check**: The endpoint finds all active recurring templates where:
   - `nextScheduled` date is in the past or null
   - Template is still active
   - End date hasn't been reached (if set)
3. **Invoice Generation**: For each matching template:
   - Creates a new transaction with invoice details
   - Updates the template's `nextScheduled` date based on frequency
   - Updates `lastGenerated` timestamp
4. **Logging**: All operations are logged to Vercel's function logs for debugging

## Deployment Steps

### Step 1: Generate a Secure CRON_SECRET

Run this command to generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - you'll need it for the next step.

### Step 2: Add Environment Variable to Vercel

**Option A: Using Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Select your project (e2w-finance)
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: [paste the generated secret from Step 1]
   - **Environments**: Check all (Production, Preview, Development)
5. Click **Save**

**Option B: Using Vercel CLI**
```bash
cd e2w-finance
vercel env add CRON_SECRET
# Paste your secret when prompted
# Select all environments
```

### Step 3: Deploy to Vercel

Push your changes to trigger a deployment:

```bash
cd e2w-finance
git add .
git commit -m "Add automatic recurring invoice generation with Vercel Cron"
git push
```

Or deploy manually:

```bash
cd e2w-finance
vercel --prod
```

### Step 4: Verify Cron Job is Active

After deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. You should see: `/api/cron/generate-recurring-invoices` with schedule `0 2 * * *`
4. Status should show as "Active"

## Testing the Cron Endpoint

### Manual Test (Recommended)

You can manually trigger the cron endpoint to test it works:

```bash
# Replace with your actual CRON_SECRET and domain
curl -X GET https://your-domain.vercel.app/api/cron/generate-recurring-invoices \
  -H "Authorization: Bearer your-cron-secret-here"
```

Expected response:
```json
{
  "message": "Recurring invoice generation completed",
  "timestamp": "2026-01-23T02:00:00.000Z",
  "templatesProcessed": 2,
  "results": {
    "success": 2,
    "failed": 0,
    "errors": []
  }
}
```

### Local Development Testing

1. Add `CRON_SECRET` to your `.env.local` file:
   ```env
   CRON_SECRET="your-test-secret"
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Test the endpoint:
   ```bash
   curl -X GET http://localhost:4239/api/cron/generate-recurring-invoices \
     -H "Authorization: Bearer your-test-secret"
   ```

## Monitoring

### View Cron Execution Logs

1. Go to Vercel Dashboard → Your Project
2. Click on **Functions** tab
3. Filter by `/api/cron/generate-recurring-invoices`
4. You'll see execution logs including:
   - Timestamp of execution
   - Number of templates processed
   - Success/failure counts
   - Any errors

### Set Up Alerts (Optional)

Consider setting up monitoring for failed cron executions:
1. Use Vercel's Integration Marketplace
2. Add Slack or email notifications
3. Configure alerts for function errors

## Troubleshooting

### Cron Job Not Running

**Check 1: Verify Environment Variable**
```bash
vercel env ls
```
Ensure `CRON_SECRET` is listed for Production.

**Check 2: Verify Cron Configuration**
- Check `vercel.json` has the `crons` array
- Verify the path matches exactly: `/api/cron/generate-recurring-invoices`

**Check 3: Check Function Logs**
Look for errors in Vercel Dashboard → Functions → Your cron function

### Unauthorized Errors

If you see 401 Unauthorized:
- Verify `CRON_SECRET` environment variable is set in Vercel
- Check that the secret matches what Vercel Cron is using
- Note: Vercel Cron automatically adds the `Authorization: Bearer [secret]` header

### No Invoices Generated

If the cron runs but doesn't generate invoices:
1. Check your recurring templates have:
   - `active = true`
   - `nextScheduled` date is in the past or null
   - `endDate` is null or in the future
2. Check function logs for specific errors
3. Manually test using the curl command above

### Wrong Timezone

The cron schedule uses UTC. If you need to adjust:
- `0 2 * * *` = 2:00 AM UTC daily
- `0 14 * * *` = 2:00 PM UTC daily (8:00 AM EST)
- Use https://crontab.guru/ to help with cron syntax

## Schedule Customization

To change when invoices are generated, edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-recurring-invoices",
      "schedule": "0 14 * * *"  // Change this (2 PM UTC = 8 AM EST)
    }
  ]
}
```

Common schedules:
- `0 2 * * *` - Daily at 2 AM UTC
- `0 2 1 * *` - Monthly on the 1st at 2 AM UTC
- `0 2 * * 1` - Weekly on Mondays at 2 AM UTC
- `0 */6 * * *` - Every 6 hours

After changing, redeploy to Vercel.

## Security Notes

1. **CRON_SECRET** is critical - keep it secure
2. Never commit the actual secret to git
3. The endpoint will reject requests without the correct Authorization header
4. Only Vercel Cron Jobs (and manual curl with the secret) can trigger this endpoint

## How to Disable Automatic Generation

If you need to temporarily disable automatic generation:

**Option 1: Remove from vercel.json**
```json
{
  "functions": { ... },
  "crons": []  // Empty array
}
```

**Option 2: Deactivate Templates**
Set `active = false` on recurring templates you don't want auto-generated.

**Option 3: Remove Environment Variable**
Delete `CRON_SECRET` from Vercel - the endpoint will return 500 errors but won't crash.

## Support

If you encounter issues:
1. Check Vercel function logs first
2. Verify environment variables are set
3. Test manually with curl
4. Check that recurring templates have correct `nextScheduled` dates

---

**Last Updated**: January 23, 2026
**Vercel Cron Documentation**: https://vercel.com/docs/cron-jobs
