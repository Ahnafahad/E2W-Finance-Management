const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createRecurringTemplates() {
  console.log('🔄 Creating recurring transaction templates...\n');

  const templates = [
    // Employee Salaries (Monthly)
    {
      name: '1. Ahnaf Ahad - Monthly Salary',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 10,
      category: 'Salaries',
      subcategory: 'Employee Salaries',
      payee: 'Ahnaf Ahad',
      description: 'Monthly salary',
      amount: 15000,
      currency: 'BDT',
      paymentTerms: 'Paid 10th of following month',
      active: true,
      startDate: new Date('2025-04-01'),
    },
    {
      name: '2. Fabiha Fairuz - Monthly Salary',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 10,
      category: 'Salaries',
      subcategory: 'Employee Salaries',
      payee: 'Fabiha Fairuz',
      description: 'Monthly salary',
      amount: 13500,
      currency: 'BDT',
      paymentTerms: 'Paid 10th of following month',
      active: true,
      startDate: new Date('2025-06-01'),
    },
    {
      name: '3. Tanzim Ahmed - Monthly Salary',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 10,
      category: 'Salaries',
      subcategory: 'Employee Salaries',
      payee: 'Tanzim Ahmed',
      description: 'Employee ended',
      amount: 15000,
      currency: 'BDT',
      paymentTerms: 'Paid 10th of following month',
      active: false,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-11-30'),
    },
    {
      name: '4. Hasan Sarower - Monthly Salary',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 10,
      category: 'Salaries',
      subcategory: 'Employee Salaries',
      payee: 'Hasan Sarower',
      description: 'Employee ended',
      amount: 8000,
      currency: 'BDT',
      paymentTerms: 'Paid 10th of following month',
      active: false,
      startDate: new Date('2025-05-01'),
      endDate: new Date('2025-07-31'),
    },

    // Subscriptions (Monthly)
    {
      name: '5. Google Workspace CA - Monthly Subscription',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      category: 'Subscriptions',
      subcategory: 'Software',
      payee: 'Google Workspace CA',
      description: 'Monthly Google Workspace subscription',
      amount: 1621.1125,
      currency: 'BDT',
      active: true,
      startDate: new Date('2025-10-01'),
    },
    {
      name: '6. Framer Basic Subscription - Monthly',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      category: 'Subscriptions',
      subcategory: 'Software',
      payee: 'Framer Basic Subscription',
      description: 'Monthly Framer subscription',
      amount: 1212.5,
      currency: 'BDT',
      active: true,
      startDate: new Date('2025-07-01'),
    },
  ];

  let created = 0;
  for (const template of templates) {
    try {
      await prisma.recurringTemplate.create({ data: template });
      console.log(`✅ Created: ${template.name}`);
      created++;
    } catch (error) {
      console.log(`❌ Error: ${template.name}`);
      console.log(`   ${error.message}\n`);
    }
  }

  console.log(`\n🎉 Created ${created} recurring templates!`);
  console.log('\n📋 Summary:');
  console.log('   Active: 4 (Ahnaf, Fabiha, Google Workspace, Framer)');
  console.log('   Inactive: 2 (Tanzim, Hasan - ended)');
  console.log('\nYou can now go to /recurring page to manage these templates.');
  
  await prisma.$disconnect();
}

createRecurringTemplates().catch(console.error);
