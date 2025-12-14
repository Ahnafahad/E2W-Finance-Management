const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixYears() {
  console.log('🔧 Updating all transaction dates from 2024 to 2025...\n');

  const transactions = await prisma.transaction.findMany();
  
  let updated = 0;
  for (const tx of transactions) {
    const oldDate = new Date(tx.date);
    const oldDueDate = tx.dueDate ? new Date(tx.dueDate) : null;
    const oldPaymentDate = tx.paymentDate ? new Date(tx.paymentDate) : null;
    
    // Update year from 2024 to 2025
    const newDate = new Date(oldDate);
    newDate.setFullYear(2025);
    
    const newDueDate = oldDueDate ? new Date(oldDueDate.setFullYear(2025)) : null;
    const newPaymentDate = oldPaymentDate ? new Date(oldPaymentDate.setFullYear(2025)) : null;
    
    await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        date: newDate,
        dueDate: newDueDate,
        paymentDate: newPaymentDate,
      },
    });
    
    updated++;
  }
  
  console.log(`✅ Updated ${updated} transactions from 2024 to 2025\n`);
  
  // Verify
  const sample = await prisma.transaction.findFirst({ orderBy: { date: 'asc' } });
  if (sample) {
    const year = new Date(sample.date).getFullYear();
    console.log(`✓ Verification: First transaction is now in year ${year}`);
  }
  
  await prisma.$disconnect();
}

fixYears().catch(console.error);
