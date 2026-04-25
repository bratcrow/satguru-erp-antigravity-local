const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: {
      allowedPages: JSON.stringify(["/", "/pos", "/orders", "/customers", "/inventory", "/truck", "/settings", "/users", "/trip-history"])
    }
  });
  console.log('Updated', result.count, 'admin(s) with trip-history access');
}

main().finally(() => prisma.$disconnect());
