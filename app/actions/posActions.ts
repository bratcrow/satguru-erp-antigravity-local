'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createPOSBill(data: { customerId?: string, total: number, discount: number, tax: number, paymentMethod: string, items: any[] }) {
  // Deduct inventory stock for the items
  for (const item of data.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } }
    });
  }

  // If pending payment and we have a customer, increase pending balance
  if (data.paymentMethod === 'PENDING' && data.customerId) {
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { pendingBalance: { increment: data.total } }
    });
  }

  const bill = await prisma.pOSBill.create({
    data: {
      customerId: data.customerId || null,
      total: data.total,
      discount: data.discount,
      tax: data.tax,
      paymentMethod: data.paymentMethod,
    }
  });

  revalidatePath('/pos');
  revalidatePath('/settings');
  revalidatePath('/');
  return bill;
}
