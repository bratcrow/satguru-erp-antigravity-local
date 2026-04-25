'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function clearCustomerCredit(customerId: string, amount: number, notes?: string) {
  if (amount <= 0) throw new Error("Amount must be greater than 0");

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error("Customer not found");

  if (amount > customer.pendingBalance) {
    throw new Error("Cannot clear more than pending balance");
  }

  // Deduct from pending balance
  await prisma.customer.update({
    where: { id: customerId },
    data: { pendingBalance: { decrement: amount } }
  });

  // Record transaction
  const transaction = await prisma.paymentTransaction.create({
    data: {
      customerId,
      amount,
      type: "CREDIT_CLEAR",
      notes
    }
  });

  revalidatePath('/customers');
  revalidatePath('/settings');
  revalidatePath('/');
  return transaction;
}

export async function getAllTransactions() {
  const [bills, orders, payments] = await Promise.all([
    prisma.pOSBill.findMany({ include: { customer: true }, orderBy: { date: 'desc' } }),
    prisma.order.findMany({ include: { customer: true }, orderBy: { createdAt: 'desc' } }),
    prisma.paymentTransaction.findMany({ include: { customer: true }, orderBy: { createdAt: 'desc' } })
  ]);

  return { bills, orders, payments };
}
