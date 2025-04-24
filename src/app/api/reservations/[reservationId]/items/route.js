// import { NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export async function GET(req, { params }) {
//   const { reservationId } = params;

//   try {
//     const reservationItems = await prisma.reservationItem.findMany({
//       where: {
//         reservationId: parseInt(reservationId),
//       },
//       include: {
//         service: true,
//         PartnerRequest: true,
//       },
//     });

//     const enhancedItems = await Promise.all(
//       reservationItems.map(async (item) => {
//         let specificService = null;
//         const serviceType = item.service.type.toLowerCase();

//         if (serviceType === "salon") {
//           specificService = await prisma.salonService.findFirst({
//             where: {
//               serviceId: item.serviceId,
//               price: item.price,
//             },
//           });
//         } else if (serviceType === "restaurant") {
//           specificService = await prisma.restaurantService.findFirst({
//             where: {
//               serviceId: item.serviceId,
//               price: item.price,
//             },
//           });
//         } else if (serviceType === "hotel") {
//           specificService = await prisma.hotelService.findFirst({
//             where: {
//               serviceId: item.serviceId,
//               price: item.price,
//             },
//           });
//         }
//         // Add more sub-service types as needed

//         return {
//           ...item,
//           specificService: specificService
//             ? { name: specificService.salonSpecialty || specificService.roomType || specificService.diningOption || "Service" }
//             : { name: item.service.name },
//         };
//       })
//     );

//     return NextResponse.json(enhancedItems, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching reservation items:", error);
//     return NextResponse.json(
//       { message: "Error fetching reservation items" },
//       { status: 500 }
//     );
//   }
// }
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  const { reservationId } = params;

  try {
    const reservationItems = await prisma.reservationItem.findMany({
      where: {
        reservationId: parseInt(reservationId),
      },
      include: {
        service: true,
        PartnerRequest: true,
      },
    });

    const enhancedItems = await Promise.all(
      reservationItems.map(async (item) => {
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

    return NextResponse.json(enhancedItems, { status: 200 });
  } catch (error) {
    console.error("Error fetching reservation items:", error);
    return NextResponse.json(
      { message: "Error fetching reservation items" },
      { status: 500 }
    );
  }
}