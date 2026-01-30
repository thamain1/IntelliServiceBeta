# Multi-Tenant Deployment Guide

This guide explains how to deploy a new instance of IntelliService for a new customer with their own isolated database.

---

## Overview

Each customer gets:
- **Their own Supabase project** (isolated database, auth, storage)
- **Their own Cloudflare Pages deployment** (or custom domain)
- **Completely separate data** - no data sharing between customers

---

## Prerequisites

- Supabase account (https://supabase.com)
- Cloudflare account (https://cloudflare.com)
- Access to the IntelliService codebase
- Node.js 18+ installed locally
- Wrangler CLI (`npm install -g wrangler`)

---

## Step-by-Step Deployment

### Step 1: Create Supabase Project

1. Log in to https://app.supabase.com
2. Click **New Project**
3. Configure:
   - **Name**: Customer name (e.g., "AcmeHVAC")
   - **Database Password**: Generate a strong password (save this)
   - **Region**: Choose closest to customer location
4. Wait for project to provision (~2 minutes)
5. Go to **Settings > API** and copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 2: Run Database Migrations

1. Install Supabase CLI if not installed:
   ```bash
   npm install -g supabase
   ```

2. Link to the new project:
   ```bash
   supabase link --project-ref <project-id>
   ```
   (Project ID is in the URL: `https://app.supabase.com/project/<project-id>`)

3. Run all migrations:
   ```bash
   supabase db push
   ```

   Or manually run each SQL file in `supabase/migrations/` in order via the Supabase SQL Editor.

### Step 3: Create First Admin User

1. In Supabase dashboard, go to **Authentication > Users**
2. Click **Add User > Create New User**
3. Enter admin email and password
4. After user is created, go to **Table Editor > profiles**
5. Find the new user's row and set:
   - `role`: `admin`
   - `full_name`: Admin's name

### Step 4: Configure Environment Variables

Create a `.env.production` file for this customer (do not commit):

```env
VITE_SUPABASE_URL=https://customer-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...customer-anon-key...
VITE_GOOGLE_MAPS_API_KEY=AIza...your-maps-key...
VITE_APP_ENV=production
```

### Step 5: Build the Application

```bash
cd project

# Copy customer's env file
cp .env.production.customername .env

# Install dependencies
npm install

# Build for production
npm run build
```

### Step 6: Deploy to Cloudflare Pages

**Option A: New Pages Project (Recommended for isolation)**

```bash
# Create new project for this customer
npx wrangler pages project create customername-intelliservice --production-branch=main

# Deploy
npx wrangler pages deploy dist --project-name=customername-intelliservice
```

**Option B: Use existing project with custom domain**

```bash
# Deploy to existing project
npx wrangler pages deploy dist --project-name=intelliservice

# Then add custom domain in Cloudflare dashboard
```

### Step 7: Set Up Custom Domain (Optional)

1. In Cloudflare Dashboard, go to **Pages > Your Project > Custom Domains**
2. Click **Set up a custom domain**
3. Enter domain (e.g., `app.customerhvac.com`)
4. Add the DNS records as instructed
5. Wait for SSL certificate provisioning

---

## Deployment Options Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Separate Pages Projects** | Complete isolation, easier troubleshooting, independent deployments | More projects to manage |
| **Single Project + Custom Domains** | Fewer projects, shared infrastructure | All customers on same build, more complex |
| **Subdomains** (customer.intelliservice.com) | Professional, easy to scale | Requires wildcard SSL, DNS management |

---

## Customer Onboarding Checklist

- [ ] Create Supabase project
- [ ] Record Supabase URL and anon key
- [ ] Run database migrations
- [ ] Create admin user account
- [ ] Set user role to 'admin' in profiles table
- [ ] Build application with customer credentials
- [ ] Deploy to Cloudflare Pages
- [ ] Test login with admin account
- [ ] Set up custom domain (if requested)
- [ ] Provide customer with login credentials
- [ ] Configure Google Maps API key restrictions (optional)

---

## Environment Variables Reference

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase > Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key | Supabase > Settings > API |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Google Cloud Console |
| `VITE_APP_ENV` | Environment (production) | Set manually |

---

## Automating Deployments (Future)

For scaling to many customers, consider:

1. **Supabase Management API** - Programmatically create projects
2. **GitHub Actions** - Automated builds per customer
3. **Terraform/Pulumi** - Infrastructure as code for Cloudflare
4. **Customer Config Database** - Track all customer deployments

---

## Troubleshooting

### "Invalid API key" on login
- Verify `VITE_SUPABASE_ANON_KEY` is correct
- Ensure the key was included at build time (not runtime)

### Database tables missing
- Run all migrations in order
- Check Supabase SQL Editor for errors

### Google Maps not loading
- Verify API key is correct
- Check Google Cloud Console for API restrictions
- Ensure Maps JavaScript API is enabled

### Custom domain not working
- Wait for DNS propagation (up to 48 hours)
- Verify DNS records match Cloudflare's instructions
- Check SSL certificate status in Cloudflare dashboard

---

## Cost Estimates Per Customer

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Supabase | 500MB database, 1GB storage, 50k auth users | $25/mo Pro |
| Cloudflare Pages | Unlimited sites, 500 builds/mo | $20/mo for more builds |
| Google Maps | $200/mo credit | ~$50-100/mo typical usage |

**Estimated cost per customer**: $0-50/mo on free tiers, $75-150/mo on paid tiers
