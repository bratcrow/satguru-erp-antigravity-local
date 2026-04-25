'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getTruckTrips(routeDate: string) {
  const startOfDay = new Date(`${routeDate}T00:00:00.000Z`);
  const endOfDay = new Date(`${routeDate}T23:59:59.999Z`);

  return await prisma.truckTrip.findMany({
    where: {
      routeDate: {
        gte: startOfDay,
        lte: endOfDay,
      }
    },
    include: {
      inventory: {
        include: {
          product: true
        }
      }
    }
  });
}

// Generate a truck load based on pre-sales orders for that date and route
export async function planTruckTrip(data: { routeDate: string, route: string }) {
  const startOfDay = new Date(`${data.routeDate}T00:00:00.000Z`);
  const endOfDay = new Date(`${data.routeDate}T23:59:59.999Z`);

  // Find all orders for this route and date
  const orders = await prisma.order.findMany({
    where: {
      routeDate: { gte: startOfDay, lte: endOfDay },
      customer: { route: data.route }
    },
    include: { items: true }
  });

  // Aggregate quantities
  const aggregatedLoad: Record<string, number> = {};
  orders.forEach(o => {
    o.items.forEach(i => {
      if (!aggregatedLoad[i.productId]) aggregatedLoad[i.productId] = 0;
      aggregatedLoad[i.productId] += i.quantity;
    });
  });

  const trip = await prisma.truckTrip.create({
    data: {
      routeDate: new Date(`${data.routeDate}T12:00:00.000Z`),
      route: data.route,
      status: "PLANNED",
      inventory: {
        create: Object.entries(aggregatedLoad).map(([productId, loadedQty]) => ({
          productId,
          loadedQty
        }))
      }
    }
  });

  // Deduct from warehouse immediately
  for (const [productId, loadedQty] of Object.entries(aggregatedLoad)) {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: loadedQty } }
    });
  }

  revalidatePath('/truck');
  return trip;
}

export async function addManualInventory(tripId: string, productId: string, loadedQty: number) {
  const existing = await prisma.truckInventory.findFirst({
    where: { tripId, productId }
  });

  if (existing) {
    await prisma.truckInventory.update({
      where: { id: existing.id },
      data: { loadedQty: existing.loadedQty + loadedQty }
    });
  } else {
    await prisma.truckInventory.create({
      data: { tripId, productId, loadedQty }
    });
  }
  
  // Deduct from warehouse immediately
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: loadedQty } }
  });

  revalidatePath('/truck');
}

export async function dispatchTruck(tripId: string, personnel: { driverName: string, employee1Name?: string, employee2Name?: string }) {
  const trip = await prisma.truckTrip.findUnique({ where: { id: tripId }, include: { inventory: true } });
  if (!trip) throw new Error("Trip not found");

  // Stock is already deducted during planning/manual addition. Just update status and personnel.
  await prisma.truckTrip.update({
    where: { id: tripId },
    data: { 
      status: "OUT",
      driverName: personnel.driverName,
      employee1Name: personnel.employee1Name || null,
      employee2Name: personnel.employee2Name || null
    }
  });

  revalidatePath('/truck');
}

export async function returnTruck(tripId: string, returnsData: { invId: string, returned: number, wastage: number, damage: number }[]) {
  const trip = await prisma.truckTrip.findUnique({ where: { id: tripId }, include: { inventory: true } });
  if (!trip) throw new Error("Trip not found");

  for (const data of returnsData) {
    const invItem = trip.inventory.find(i => i.id === data.invId);
    if (!invItem) continue;

    const soldQty = invItem.loadedQty - data.returned - data.wastage - data.damage;

    // Update inventory item
    await prisma.truckInventory.update({
      where: { id: data.invId },
      data: { 
        returnedQty: data.returned,
        wastage: data.wastage,
        damage: data.damage,
        soldQty: soldQty
      }
    });

    // Add returned stock back to warehouse
    await prisma.product.update({
      where: { id: invItem.productId },
      data: { stock: { increment: data.returned } }
    });
  }

  await prisma.truckTrip.update({
    where: { id: tripId },
    data: { status: "RETURNED" }
  });

  revalidatePath('/truck');
}

export async function getCompletedTrips() {
  return await prisma.truckTrip.findMany({
    where: { status: 'RETURNED' },
    include: {
      inventory: {
        include: { product: true }
      }
    },
    orderBy: { routeDate: 'desc' },
    take: 100
  });
}
