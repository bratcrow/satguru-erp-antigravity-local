'use server';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function getUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      allowedPages: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createUser(data: {
  username: string;
  passwordHash: string;
  pinCode?: string;
  role: string;
  allowedPages: string;
}) {
  const hashedPassword = await bcrypt.hash(data.passwordHash, 10);
  
  await prisma.user.create({
    data: {
      username: data.username,
      passwordHash: hashedPassword,
      pinCode: data.pinCode || null,
      role: data.role,
      allowedPages: data.allowedPages
    }
  });
  
  revalidatePath('/users');
}
