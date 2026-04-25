const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  console.log('Starting data import to the new cloud database...');
  try {
    if (!fs.existsSync('data-backup.json')) {
      throw new Error('data-backup.json not found! Please run export-data.js first.');
    }

    const data = JSON.parse(fs.readFileSync('data-backup.json', 'utf8'));

    // We use createMany or individual creates to import data.
    // Order matters due to foreign key constraints!

    console.log('Importing Users...');
    if (data.users.length) await prisma.user.createMany({ data: data.users, skipDuplicates: true });

    console.log('Importing Products...');
    if (data.products.length) await prisma.product.createMany({ data: data.products, skipDuplicates: true });

    console.log('Importing Raw Materials...');
    if (data.rawMaterials.length) await prisma.rawMaterial.createMany({ data: data.rawMaterials, skipDuplicates: true });

    console.log('Importing Recipes...');
    if (data.recipes.length) await prisma.recipe.createMany({ data: data.recipes, skipDuplicates: true });

    console.log('Importing Customers...');
    if (data.customers.length) await prisma.customer.createMany({ data: data.customers, skipDuplicates: true });

    console.log('Importing Employees...');
    if (data.employees.length) await prisma.employee.createMany({ data: data.employees, skipDuplicates: true });

    console.log('Importing Payment Transactions...');
    if (data.paymentTransactions.length) await prisma.paymentTransaction.createMany({ data: data.paymentTransactions, skipDuplicates: true });

    console.log('Importing Orders...');
    if (data.orders.length) await prisma.order.createMany({ data: data.orders, skipDuplicates: true });

    console.log('Importing Order Items...');
    if (data.orderItems.length) await prisma.orderItem.createMany({ data: data.orderItems, skipDuplicates: true });

    console.log('Importing Truck Trips...');
    if (data.truckTrips.length) await prisma.truckTrip.createMany({ data: data.truckTrips, skipDuplicates: true });

    console.log('Importing Truck Inventories...');
    if (data.truckInventories.length) await prisma.truckInventory.createMany({ data: data.truckInventories, skipDuplicates: true });

    console.log('Importing POS Bills...');
    if (data.posBills.length) await prisma.posBill.createMany({ data: data.posBills, skipDuplicates: true });

    console.log('✅ Data successfully imported! You can now use your app completely online.');
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
