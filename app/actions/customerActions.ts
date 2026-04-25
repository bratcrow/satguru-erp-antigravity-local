'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCustomers() {
  return await prisma.customer.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function addCustomer(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as string; // 'RETAIL' or 'WHOLESALE'
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const route = formData.get('route') as string;

  if (!name || !type || !route) {
    throw new Error('Name, Type, and Route are required');
  }

  await prisma.customer.create({
    data: {
      name,
      type,
      phone: phone || null,
      address: address || null,
      route,
    }
  });

  revalidatePath('/customers');
}

export async function deleteCustomer(id: string) {
  await prisma.customer.delete({
    where: { id }
  });
  revalidatePath('/customers');
}
