const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('Admin already exists.');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: hashedPassword,
      pinCode: '123456',
      role: 'ADMIN',
      allowedPages: '["/", "/pos", "/inventory", "/customers", "/orders", "/truck", "/settings", "/users"]',
    },
  });

  console.log('Admin user created successfully!');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('PIN: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
