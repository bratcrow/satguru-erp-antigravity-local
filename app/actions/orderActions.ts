'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getOrdersByDate(routeDate: string) {
  // Parse YYYY-MM-DD to start and end of day
  const startOfDay = new Date(`${routeDate}T00:00:00.000Z`);
  const endOfDay = new Date(`${routeDate}T23:59:59.999Z`);

  return await prisma.order.findMany({
    where: {
      routeDate: {
        gte: startOfDay,
        lte: endOfDay,
      }
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createOrder(data: { customerId: string; routeDate: string; items: { productId: string; quantity: number; price: number }[] }) {
  if (!data.customerId || !data.routeDate || data.items.length === 0) {
    throw new Error('Invalid order data');
  }

  const routeDate = new Date(`${data.routeDate}T12:00:00.000Z`);
  const total = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  await prisma.order.create({
    data: {
      customerId: data.customerId,
      routeDate,
      total,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }
  });

  revalidatePath('/orders');
}

export async function updateOrder(id: string, data: { items: { productId: string; quantity: number; price: number }[] }) {
  if (data.items.length === 0) throw new Error('Invalid order data');

  const total = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  // Delete old items
  await prisma.orderItem.deleteMany({ where: { orderId: id } });

  // Update order total and recreate items
  await prisma.order.update({
    where: { id },
    data: {
      total,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      }
    }
  });

  revalidatePath('/orders');
}

export async function deleteOrder(id: string) {
  await prisma.orderItem.deleteMany({ where: { orderId: id } });
  await prisma.order.delete({ where: { id } });
  revalidatePath('/orders');
}
