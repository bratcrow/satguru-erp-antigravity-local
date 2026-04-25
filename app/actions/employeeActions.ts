'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addEmployee(data: FormData) {
  const name = data.get('name') as string;
  const role = data.get('role') as string;
  const phone = data.get('phone') as string;

  await prisma.employee.create({
    data: { name, role, phone }
  });

  revalidatePath('/settings');
}

export async function deleteEmployee(id: string) {
  await prisma.employee.delete({ where: { id } });
  revalidatePath('/settings');
}
