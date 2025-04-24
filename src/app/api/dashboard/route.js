import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// Helper function to safely serialize BigInt values
function serializeData(data) {
  return JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? Number(value) : value
  ));
}

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get number of buyers
    const buyersCount = await prisma.user.count({
      where: { role: 'BUYER' },
    });

    // Get number of sellers
    const sellersCount = await prisma.user.count({
      where: { role: 'SELLER' },
    });

    // Get total services count
    const servicesCount = await prisma.service.count();

    // Get services by category
    const serviceCategories = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN EXISTS (SELECT 1 FROM "SalonService" WHERE "serviceId" = "Service".id) THEN 'Salon'
          WHEN EXISTS (SELECT 1 FROM "RestaurantService" WHERE "serviceId" = "Service".id) THEN 'Restaurant'
          WHEN EXISTS (SELECT 1 FROM "HotelService" WHERE "serviceId" = "Service".id) THEN 'Hotel'
          WHEN EXISTS (SELECT 1 FROM "CarService" WHERE "serviceId" = "Service".id) THEN 'Car'
          WHEN EXISTS (SELECT 1 FROM "GymService" WHERE "serviceId" = "Service".id) THEN 'Gym'
          WHEN EXISTS (SELECT 1 FROM "FlightService" WHERE "serviceId" = "Service".id) THEN 'Flight'
          WHEN EXISTS (SELECT 1 FROM "HallService" WHERE "serviceId" = "Service".id) THEN 'Hall'
          WHEN EXISTS (SELECT 1 FROM "ActivityService" WHERE "serviceId" = "Service".id) THEN 'Activity'
          WHEN EXISTS (SELECT 1 FROM "PlaygroundService" WHERE "serviceId" = "Service".id) THEN 'Playground'
          ELSE 'Other'
        END as category,
        COUNT(*) as count
      FROM "Service"
      GROUP BY category
    `;

    // Get reservations over time (based on selected date range)
    const reservationsByDate = await prisma.reservation.groupBy({
      by: ['createdAt'],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format data for frontend charts
    const formattedReservations = reservationsByDate.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      count: item._count.id,
    }));

    // Get service performance data (reservations by service category)
    const servicePerformance = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN EXISTS (SELECT 1 FROM "SalonService" WHERE "serviceId" = s.id) THEN 'Salon'
          WHEN EXISTS (SELECT 1 FROM "RestaurantService" WHERE "serviceId" = s.id) THEN 'Restaurant'
          WHEN EXISTS (SELECT 1 FROM "HotelService" WHERE "serviceId" = s.id) THEN 'Hotel'
          WHEN EXISTS (SELECT 1 FROM "CarService" WHERE "serviceId" = s.id) THEN 'Car'
          WHEN EXISTS (SELECT 1 FROM "GymService" WHERE "serviceId" = s.id) THEN 'Gym'
          WHEN EXISTS (SELECT 1 FROM "FlightService" WHERE "serviceId" = s.id) THEN 'Flight'
          WHEN EXISTS (SELECT 1 FROM "HallService" WHERE "serviceId" = s.id) THEN 'Hall'
          WHEN EXISTS (SELECT 1 FROM "ActivityService" WHERE "serviceId" = s.id) THEN 'Activity'
          WHEN EXISTS (SELECT 1 FROM "PlaygroundService" WHERE "serviceId" = s.id) THEN 'Playground'
          ELSE 'Other'
        END as category,
        COUNT(DISTINCT ri.id) as reservations
      FROM "Service" s
      JOIN "ReservationItem" ri ON ri."serviceId" = s.id
      JOIN "Reservation" r ON ri."reservationId" = r.id
      WHERE r."createdAt" >= ${startDate}
      GROUP BY category
      ORDER BY reservations DESC
    `;

    // Convert BigInt values to regular numbers
    const processedServiceCategories = serviceCategories.map(category => ({
      category: category.category,
      count: Number(category.count)
    }));

    const processedServicePerformance = servicePerformance.map(item => ({
      category: item.category,
      reservations: Number(item.reservations)
    }));

    return NextResponse.json({
      buyersCount,
      sellersCount,
      servicesCount,
      serviceCategories: processedServiceCategories,
      reservationsByDate: formattedReservations,
      servicePerformance: processedServicePerformance,
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}