const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating ExplorePro transaction...');

  // Define the line items
  const lineItems = [
    {
      title: "Discovery & Strategy Phase",
      details: [
        "Initial consultation & 5 discovery meetings (bundled)",
        "Requirements gathering & analysis"
      ],
      amount: 100.00
    },
    {
      title: "Product Documentation",
      details: [
        "Comprehensive Product Requirements Document (PRD)",
        "Technical specifications & user flows"
      ],
      amount: 120.00
    },
    {
      title: "App Design & Development",
      details: [
        "4 design iterations with revisions",
        "Final production-ready version (deployed)",
        "Complete UI/UX design system"
      ],
      amount: 280.00
    },
    {
      title: "UI Screen Design",
      details: [
        "20 professional UI screens",
        "High-fidelity mockups across all app sections"
      ],
      amount: 150.00
    },
    {
      title: "Social Media Assets",
      details: [
        "6 custom social media posts",
        "Instagram feed mockups & carousel design"
      ],
      amount: 60.00
    },
    {
      title: "Brand Identity (To be finalized post-discussion)",
      details: [
        "Logo design & brand kit development",
        "Typography, color palette & usage guidelines"
      ],
      amount: 40.00
    },
    {
      title: "Go-to-Market Strategy",
      details: [
        "Market analysis & target audience segmentation",
        "Launch timeline & strategy recommendations"
      ],
      amount: 50.00
    }
  ];

  // Calculate total
  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      type: 'INCOME',
      date: new Date('2024-12-23'),
      dueDate: new Date('2024-12-23'),
      category: 'Professional Services',
      subcategory: 'Design & Development',
      payee: 'Herman Tse',
      description: 'ExplorePro - Founder\'s Essentials Package',
      amount: totalAmount,
      currency: 'GBP',
      exchangeRate: 160.0, // Approximate GBP to BDT rate
      amountBDT: totalAmount * 160.0,
      paymentStatus: 'UNPAID',
      invoiceNumber: 'INV-DEC-EXPLOREPRO',
      invoiceGenerated: false,
      lineItemsJson: JSON.stringify(lineItems),
      projectName: 'Founder\'s Essentials Package',
      duration: '22 Oct – 23 Dec 2024',
      notes: 'Client: ExplorePro (Herman Tse)',
    },
  });

  console.log('Transaction created successfully!');
  console.log('Transaction ID:', transaction.id);
  console.log('Invoice Number:', transaction.invoiceNumber);
  console.log('Total Amount: £', totalAmount.toFixed(2));
  console.log('Line Items:', lineItems.length);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
