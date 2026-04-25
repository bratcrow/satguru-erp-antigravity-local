'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function addProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const sku = formData.get('sku') as string;
  const retailPrice = parseFloat(formData.get('retailPrice') as string);
  const wholesalePrice = parseFloat(formData.get('wholesalePrice') as string);
  const initialStock = parseFloat(formData.get('stock') as string) || 0;

  if (!name || !sku || isNaN(retailPrice) || isNaN(wholesalePrice)) {
    throw new Error('Invalid input data');
  }

  await prisma.product.create({
    data: {
      name,
      sku,
      retailPrice,
      wholesalePrice,
      stock: initialStock,
    }
  });

  revalidatePath('/inventory');
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id }
  });
  revalidatePath('/inventory');
}

export async function updateProduct(id: string, data: { name: string, sku: string, retailPrice: number, wholesalePrice: number, stock: number }) {
  await prisma.product.update({
    where: { id },
    data
  });
  revalidatePath('/inventory');
}

export async function addStock(id: string, amountToAdd: number) {
  await prisma.product.update({
    where: { id },
    data: {
      stock: { increment: amountToAdd }
    }
  });
  revalidatePath('/inventory');
}
