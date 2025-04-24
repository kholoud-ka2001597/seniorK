import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to validate and parse numbers
const validateNumber = (value, defaultValue) =>
  value === "" || isNaN(value) ? defaultValue : parseFloat(value);

export async function GET(request) {
  const url = new URL(request.url);
  const queryParams = new URLSearchParams(url.search);

  console.log("url: ", url);
  console.log("query params: ", queryParams);

  // Get query parameters with default values
  const query = queryParams.get("query") || "";
  const location = queryParams.get("location") || "";
  const minPrice = queryParams.get("minPrice") ? validateNumber(queryParams.get("minPrice"), 0.0) : null;
  const maxPrice = queryParams.get("maxPrice") ? validateNumber(queryParams.get("maxPrice"), 1000.0) : null;
  const rating = validateNumber(queryParams.get("rating"), 0.0);
  const category = queryParams.get("category") || "all";

  console.log(query, location, minPrice, maxPrice, rating, category);

  try {
    // Define base filters for Service model
    const filters = {};
    const conditions = [];

    // Search text filter
    if (query) {
      conditions.push({
        OR: [
          { type: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      });
    }

    // Location filter
    if (location) {
      conditions.push({
        location: { contains: location, mode: "insensitive" },
      });
    }

    // Rating filter
    if (rating > 0) {
      conditions.push({
        rating: { gte: rating },
      });
    }

    // Category filter
    if (category !== "all") {
      conditions.push({
        type: { equals: category, mode: "insensitive" },
      });
    }

    // Apply base conditions
    if (conditions.length > 0) {
      filters.AND = conditions;
    }

    // Handle price filtering only if minPrice and maxPrice are provided
    let serviceIds = [];

    if (minPrice !== null && maxPrice !== null) {
      if (category !== "all") {
        const categoryModelMap = {
          salon: "SalonService",
          restaurant: "RestaurantService",
          hotel: "HotelService",
          car: "CarService",
          gym: "GymService",
          flight: "FlightService",
          hall: "HallService",
          activity: "ActivityService",
          playground: "PlaygroundService",
        };

        const specificServiceModel = categoryModelMap[category.toLowerCase()];

        if (specificServiceModel) {
          console.log(`Querying model: ${specificServiceModel}`);
          const specificServices = await prisma[specificServiceModel].findMany({
            where: {
              price: { gte: minPrice, lte: maxPrice },
            },
            select: {
              serviceId: true,
            },
          });

          serviceIds = [...new Set(specificServices.map((s) => s.serviceId))];
          console.log(`Matching serviceIds for ${category}:`, serviceIds);

          if (serviceIds.length === 0) {
            console.log(`No ${category} services found in price range [${minPrice}, ${maxPrice}]`);
            return new Response(JSON.stringify({ success: true, data: [] }), {
              status: 200,
            });
          }

          filters.AND = filters.AND || [];
          filters.AND.push({
            id: { in: serviceIds },
          });
        } else {
          console.warn(`Invalid category: ${category}`);
          return new Response(
            JSON.stringify({ success: false, message: `Invalid category: ${category}` }),
            { status: 400 }
          );
        }
      } else {
        const allServiceModels = [
          "SalonService",
          "RestaurantService",
          "HotelService",
          "CarService",
          "GymService",
          "FlightService",
          "HallService",
          "ActivityService",
          "PlaygroundService",
        ];

        console.log("Querying all service models:", allServiceModels);

        for (const model of allServiceModels) {
          console.log(`Querying model: ${model}`);
          const specificServices = await prisma[model].findMany({
            where: {
              price: { gte: minPrice, lte: maxPrice },
            },
            select: {
              serviceId: true,
            },
          });
          serviceIds.push(...specificServices.map((s) => s.serviceId));
        }

        serviceIds = [...new Set(serviceIds)];
        console.log("All matching serviceIds:", serviceIds);

        if (serviceIds.length === 0) {
          console.log(`No services found in price range [${minPrice}, ${maxPrice}]`);
          return new Response(JSON.stringify({ success: true, data: [] }), {
            status: 200,
          });
        }

        filters.AND = filters.AND || [];
        filters.AND.push({
          id: { in: serviceIds },
        });
      }
    }

    console.log("Final filters:", JSON.stringify(filters, null, 2));

    // Fetch services with related data
    const items = await prisma.service.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
      include: {
        salonServices: true,
        RestaurantService: true, // Fixed: Use singular and match schema exactly
        hotelServices: true,
        carServices: true,
        gymServices: true,
        flightServices: true,
        hallServices: true,
        activityServices: true,
        playgroundServices: true,
      },
    });

    // Transform the data to flatten the response for the frontend
    const transformedItems = items.map((service) => {
      let specificService = {};
      switch (service.type.toLowerCase()) {
        case "salon":
          specificService = service.salonServices[0] || {};
          return {
            ...service,
            price: specificService.price,
            salonSpecialty: specificService.salonSpecialty,
          };
        case "restaurant":
          specificService = service.RestaurantService[0] || {}; // Fixed: Use singular
          return {
            ...service,
            price: specificService.price,
            diningOption: specificService.diningOption,
            numPersons: specificService.numPersons,
            seatsAvailable: specificService.seatsAvailable,
          };
        case "hotel":
          specificService = service.hotelServices[0] || {};
          return {
            ...service,
            price: specificService.price,
            roomType: specificService.roomType,
            amenities: specificService.amenities,
            hotelStars: specificService.hotelStars,
            noOfRooms: specificService.noOfRooms,
          };
        case "car":
          specificService = service.carServices[0] || {};
          return {
            ...service,
            price: specificService.price,
            carModel: specificService.carModel,
            carType: specificService.carType,
            carCapacity: specificService.carCapacity,
          };
        case "gym":
          specificService = service.gymServices[0] || {};
          return {
            ...service,
            price: specificService.price,
            gymFacilities: specificService.gymFacilities,
            membershipTypes: specificService.membershipTypes,
            operatingHours: specificService.operatingHours,
          };
        case "flight":
          specificService = service.flightServices[0] || {};
          return {
            ...service,
            price: specificService.price,
            airlineName: specificService.airlineName,
            flightClass: specificService.flightClass,
            seatsAvailable: specificService.seatsAvailable,
          };
        case "hall":
          specificService = service.hallServices[0] || {};
          return {
            ...service,
            price: specificService.price,
            hallCapacity: specificService.hallCapacity,
            eventType: specificService.eventType,
          };
        case "activity":
          specificService = service.activityServices[0] || {};
          return {
            ...service,
            price: specificService.price,
            activityType: specificService.activityType,
          };
        case "playground":
          specificService = service.playgroundServices[0] || {};
          return {
            ...service,
            price: specificService.price,
            playgroundType: specificService.playgroundType,
            ageGroup: specificService.ageGroup,
            equipment: specificService.equipment,
          };
        default:
          return service;
      }
    });

    return new Response(JSON.stringify({ success: true, data: transformedItems }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching search results:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal server error" }),
      { status: 500 }
    );
  }
}