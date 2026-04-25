const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Initialize Prisma
const prisma = new PrismaClient();

async function main() {
    console.log('--- System: Admin Creation Protocol Starting ---');

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('admin123', saltRounds);

        // Create the admin user
        const admin = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {}, // If user exists, do nothing
            create: {
                username: 'admin',
                passwordHash: hashedPassword,
                pinCode: '123456',
                role: 'ADMIN',
                allowedPages: JSON.stringify(["/", "/pos", "/orders", "/customers", "/inventory", "/truck", "/settings", "/users", "/trip-history"])
            },
        });

        console.log('✅ Success! Admin account is ready.');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('--- You can now close this script ---');
    } catch (error) {
        console.error('❌ Critical Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();