const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanAndReseed() {
  console.log('🗑️  Deleting all transactions...');
  await prisma.transaction.deleteMany();
  console.log('✅ All transactions deleted');
  
  console.log('\n📌 Now run: npm run prisma:seed');
  console.log('   This will import only the 30 clean transactions\n');
  
  await prisma.$disconnect();
}

cleanAndReseed().catch(console.error);
