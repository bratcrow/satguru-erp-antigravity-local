const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  console.log('Starting data export from local SQLite database...');
  try {
    const backup = {
      users: await prisma.user.findMany(),
      products: await prisma.product.findMany(),
      rawMaterials: await prisma.rawMaterial.findMany(),
      recipes: await prisma.recipe.findMany(),
      customers: await prisma.customer.findMany(),
      employees: await prisma.employee.findMany(),
      paymentTransactions: await prisma.paymentTransaction.findMany(),
      orders: await prisma.order.findMany(),
      orderItems: await prisma.orderItem.findMany(),
      truckTrips: await prisma.truckTrip.findMany(),
      truckInventories: await prisma.truckInventory.findMany(),
      posBills: await prisma.posBill.findMany(),
    };

    fs.writeFileSync('data-backup.json', JSON.stringify(backup, null, 2));
    console.log('✅ Data successfully exported to data-backup.json');
    console.log('Your data is now safe and backed up!');
  } catch (error) {
    console.error('Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
