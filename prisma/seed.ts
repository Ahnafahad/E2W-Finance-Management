import { PrismaClient, TransactionType, Currency, PaymentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface LegacyTransaction {
  payee: string;
  category: string;
  month: string;
  amount: number;
  payment_terms: string;
}

const monthMap: { [key: string]: number } = {
  'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
  'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
};

function parseCategory(category: string): { main: string; subcategory?: string } {
  const cleaned = category.replace(/\(.*?\)/g, '').trim();
  return { main: cleaned };
}

function calculateDueDate(month: string, paymentTerms: string): Date {
  const year = 2024;
  const monthIndex = monthMap[month];

  if (paymentTerms.includes('10th of Following Month')) {
    const nextMonth = monthIndex + 1;
    return new Date(year, nextMonth, 10);
  }

  // Default: end of month
  return new Date(year, monthIndex + 1, 0);
}

function determineTransactionDate(month: string): Date {
  const year = 2024;
  const monthIndex = monthMap[month];
  // First day of the month
  return new Date(year, monthIndex, 1);
}

function getCurrency(amount: number, payee: string): Currency {
  // All legacy transactions are in BDT (already converted)
  return Currency.BDT;
}

function getExchangeRate(currency: Currency): number | null {
  // No exchange rate needed - all amounts already in BDT
  return null;
}

function calculateBDTAmount(amount: number, currency: Currency, exchangeRate: number | null): number {
  if (currency === Currency.BDT) {
    return amount;
  }
  if (currency === Currency.USD && exchangeRate) {
    return amount * exchangeRate;
  }
  return amount;
}

async function seedDefaultCategories() {
  const categories = [
    { name: 'Salaries', type: 'EXPENSE', color: '#3b82f6', icon: 'users' },
    { name: 'Subscriptions', type: 'EXPENSE', color: '#8b5cf6', icon: 'credit-card' },
    { name: 'Office Expenses', type: 'EXPENSE', color: '#f59e0b', icon: 'building' },
    { name: 'Marketing', type: 'EXPENSE', color: '#ec4899', icon: 'megaphone' },
    { name: 'Software', type: 'EXPENSE', color: '#6366f1', icon: 'code' },
    { name: 'Utilities', type: 'EXPENSE', color: '#14b8a6', icon: 'zap' },
    { name: 'Client Projects', type: 'INCOME', color: '#10b981', icon: 'briefcase' },
    { name: 'Consulting', type: 'INCOME', color: '#22c55e', icon: 'users' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('✅ Default categories seeded');
}

async function seedAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@e2w.com';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      role: 'admin',
    },
  });

  console.log('✅ Admin user created');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

async function seedTransactions() {
  const jsonPath = path.join(process.cwd(), '..', 'transactions.json');

  if (!fs.existsSync(jsonPath)) {
    console.log('⚠️  transactions.json not found, skipping transaction import');
    return;
  }

  const data = fs.readFileSync(jsonPath, 'utf-8');
  const allTransactions: LegacyTransaction[] = JSON.parse(data);

  // Filter out summary/total rows
  const summaryKeywords = ['subtotal', 'total', 'sum', 'grand'];
  const transactions = allTransactions.filter(tx => {
    const payeeLower = tx.payee.toLowerCase();
    return !summaryKeywords.some(keyword => payeeLower.includes(keyword));
  });

  console.log(`📦 Found ${allTransactions.length} entries, importing ${transactions.length} actual transactions (filtered ${allTransactions.length - transactions.length} summary rows)...`);

  let imported = 0;
  for (const tx of transactions) {
    const { main: category } = parseCategory(tx.category);
    const currency = getCurrency(tx.amount, tx.payee);
    const exchangeRate = getExchangeRate(currency);
    const amountBDT = calculateBDTAmount(tx.amount, currency, exchangeRate);
    const date = determineTransactionDate(tx.month);
    const dueDate = calculateDueDate(tx.month, tx.payment_terms);

    // Determine if it's paid (assume current transactions before Nov are paid)
    const isPaid = monthMap[tx.month] < 10; // Before November

    try {
      await prisma.transaction.create({
        data: {
          type: TransactionType.EXPENSE, // All legacy transactions are expenses
          date,
          dueDate,
          category,
          payee: tx.payee,
          description: tx.payment_terms,
          amount: tx.amount,
          currency,
          exchangeRate,
          amountBDT,
          paymentStatus: isPaid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
          paymentDate: isPaid ? dueDate : null,
          notes: `Imported from legacy system - ${tx.month} 2024`,
        },
      });
      imported++;
    } catch (error) {
      console.error(`❌ Failed to import transaction for ${tx.payee} - ${tx.month}:`, error);
    }
  }

  console.log(`✅ Imported ${imported} transactions`);
}

async function seedExchangeRates() {
  const rates = [
    { fromCurrency: Currency.USD, toCurrency: Currency.BDT, rate: 110, date: new Date('2024-01-01') },
    { fromCurrency: Currency.USD, toCurrency: Currency.BDT, rate: 110.5, date: new Date('2024-06-01') },
    { fromCurrency: Currency.USD, toCurrency: Currency.BDT, rate: 111, date: new Date('2024-12-01') },
    { fromCurrency: Currency.GBP, toCurrency: Currency.BDT, rate: 140, date: new Date('2024-01-01') },
    { fromCurrency: Currency.EUR, toCurrency: Currency.BDT, rate: 120, date: new Date('2024-01-01') },
  ];

  for (const rate of rates) {
    await prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency_date: {
          fromCurrency: rate.fromCurrency,
          toCurrency: rate.toCurrency,
          date: rate.date,
        },
      },
      update: {},
      create: rate,
    });
  }

  console.log('✅ Exchange rates seeded');
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await seedAdminUser();
    await seedDefaultCategories();
    await seedExchangeRates();
    await seedTransactions();

    console.log('\n✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
