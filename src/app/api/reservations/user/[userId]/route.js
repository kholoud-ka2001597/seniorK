import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  const { userId } = params;

  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: parseInt(userId),
        status: { in: ["confirmed", "completed"] },
      },
      include: {
        reservationItems: {
          include: {
            service: true,
            PartnerRequest: true,
          },
        },
      },
    });

    const enhancedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        const enhancedItems = await Promise.all(
          reservation.reservationItems.map(async (item) => {
            let specificService = null;
            const serviceType = item.service.type.toLowerCase();

            // Fetch the appropriate sub-service based on service type
            if (serviceType === "salon") {
              specificService = await prisma.salonService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            } else if (serviceType === "restaurant") {
              specificService = await prisma.restaurantService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            } else if (serviceType === "hotel") {
              specificService = await prisma.hotelService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            } else if (serviceType === "car") {
              specificService = await prisma.carService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            } else if (serviceType === "gym") {
              specificService = await prisma.gymService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            } else if (serviceType === "flight") {
              specificService = await prisma.flightService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            } else if (serviceType === "hall") {
              specificService = await prisma.hallService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            } else if (serviceType === "activity") {
              specificService = await prisma.activityService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            } else if (serviceType === "playground") {
              specificService = await prisma.playgroundService.findFirst({
                where: {
                  serviceId: item.serviceId,
                  price: item.price,
                },
              });
            }

            return {
              ...item,
              specificService: specificService
                ? {
                    name:
                      specificService.salonSpecialty ||
                      specificService.diningOption ||
                      specificService.roomType ||
                      specificService.carModel ||
                      specificService.membershipTypes ||
                      specificService.flightClass ||
                      specificService.eventType ||
                      specificService.activityType ||
                      specificService.playgroundType ||
                      "Service",
                  }
                : { name: item.service.name },
            };
          })
        );

        return {
          ...reservation,
          reservationItems: enhancedItems,
        };
      })
    );

    return NextResponse.json({ reservations: enhancedReservations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}