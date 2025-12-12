# E2W Financial Management System

A modern web-based financial management system for tracking expenses, income, and generating professional invoices.

## Features

- 💰 **Transaction Management** - Track expenses and income with multi-currency support
- 📊 **Dashboard** - Real-time financial insights and analytics
- 📄 **Invoice Generation** - Professional PDF invoices with E2W branding
- 🔄 **Recurring Transactions** - Automate monthly salaries and subscriptions
- 💱 **Multi-Currency** - Support for BDT, USD, GBP, EUR with exchange rates
- 🔐 **Authentication** - Secure password-protected access
- 📈 **Reports** - Financial reports and analytics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: NextAuth.js
- **PDF Generation**: pdf-lib
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd e2w-finance
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration.

4. Set up the database
```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Default Credentials

- **Email**: admin@e2w.com
- **Password**: admin123

⚠️ **Important**: Change these credentials in production!

## Database Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Seed database with sample data
npm run prisma:seed
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables

Required environment variables for production:

```
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate-a-secure-random-string"
ADMIN_EMAIL="admin@e2w.com"
ADMIN_PASSWORD_HASH="bcrypt-hashed-password"
```

## Project Structure

```
e2w-finance/
├── prisma/              # Database schema and migrations
├── public/              # Static files (logos, invoices)
├── src/
│   ├── app/            # Next.js app router
│   │   ├── api/        # API routes
│   │   ├── (auth)/     # Authentication pages
│   │   └── (dashboard)/ # Dashboard pages
│   ├── components/     # React components
│   └── lib/            # Utilities and configurations
└── vercel.json         # Vercel configuration
```

## Features Roadmap

- [x] Transaction management
- [x] Invoice generation
- [x] Dashboard and analytics
- [x] Multi-currency support
- [x] Recurring transactions
- [ ] Advanced reporting
- [ ] Email notifications
- [ ] Document attachments
- [ ] Client/Vendor management
- [ ] Audit trail

## License

Proprietary - E2W Internal Use Only

## Support

For issues or questions, contact the E2W development team.
