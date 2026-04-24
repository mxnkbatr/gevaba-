import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { adminUser, db, errorResponse } = await adminGuard(request);
    if (errorResponse) return errorResponse;

    // 1. Fetch All Users
    const users = await db.collection("users").find({}).toArray();

    // 2. Fetch All Bookings
    const rawBookings = await db.collection("bookings")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // 3. Fetch Standard Services
    const standardServices = await db.collection("services").find({}).toArray();

    // Map bookings to include monkName and serviceName
    const bookings = rawBookings.map((b: any) => {
      let monkName = b.monkName || null;
      if (!monkName && b.monkId) {
        const monk = users.find((u: any) => u._id.toString() === b.monkId);
        if (monk) monkName = monk.name;
      }

      let serviceName = b.serviceName || null;
      if (!serviceName && b.serviceId) {
        // Try standard services first
        const sSvc = standardServices.find((s: any) => s._id.toString() === b.serviceId || s.id === b.serviceId);
        if (sSvc) {
          serviceName = sSvc.name || sSvc.title;
        } else if (monkName) {
          // If it's a monk-specific service, try to find it in the monk's services array
          const monk = users.find((u: any) => u._id.toString() === b.monkId);
          const mSvc = monk?.services?.find((s: any) => s.id === b.serviceId || s._id === b.serviceId);
          if (mSvc) serviceName = mSvc.name || mSvc.title;
        }
      }

      return {
        ...b,
        monkName,
        serviceName
      };
    });


    // 4. Extract Monk Services (for approval)
    // We use a Map to deduplicate services by their ID
    const servicesMap = new Map<string, any>();

    // First, add all standard services
    standardServices.forEach((svc: any) => {
      // Ensure we have a string ID. Fallback to _id if id is missing.
      const key = svc.id ? svc.id.toString() : svc._id.toString();

      servicesMap.set(key, {
        ...svc,
        id: key, // Normalize id to string
        _id: svc._id ? svc._id.toString() : key,
        source: "standard",
        isShared: true, // Standard services are available to all or many
        monkName: { mn: "Standard Service", en: "Standard Service" }
      });
    });

    // Then process monk services
    users
      .filter((u: any) => u.role === 'monk' && u.services && Array.isArray(u.services))
      .forEach((monk: any) => {
        monk.services.forEach((svc: any) => {
          // Ensure we have a string ID
          const key = svc.id ? svc.id.toString() : (svc._id ? svc._id.toString() : null);

          if (!key) return; // Skip invalid services

          if (servicesMap.has(key)) {
            // Service already exists (either standard or from another monk)
            const existing = servicesMap.get(key);
            // If it was already a monk service, mark it as multiple monks
            if (existing.source === "monk") {
              existing.monkName = { mn: "Олон лам", en: "Multiple Monks" };
              existing.isShared = true;
            }
            // We could accumulate stats here if needed, e.g. count providers
          } else {
            // New unique service found from a monk
            servicesMap.set(key, {
              ...svc,
              id: key,
              _id: key, // Use the internal ID as _id
              source: "monk",
              monkId: monk._id.toString(),
              monkName: monk.name,
              type: "Monk Service",
              status: svc.status || 'active'
            });
          }
        });
      });

    const allServices = Array.from(servicesMap.values());

    // 6. Shop: Products + Orders (for admin dashboard)
    const products = await db
      .collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const orders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // 5. Calculate Stats
    const stats = {
      totalUsers: users.length,
      totalMonks: users.filter((u: any) => u.role === 'monk').length,
      totalBookings: bookings.length,
      revenue: bookings.reduce((acc: number, curr: any) => {
        return curr.status === 'completed' ? acc + 1 : acc;
      }, 0)
    };

    return NextResponse.json({
      users,
      bookings,
      services: allServices,
      products,
      orders,
      stats
    });

  } catch (error) {
    console.error("Admin Data Error:", error);
    return NextResponse.json({ message: "Admin Data Error" }, { status: 500 });
  }
}