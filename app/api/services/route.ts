import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { currentUser } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Read-only: do not run updateMany here — that was blocking every consumer
    // (e.g. monk profile) and is already handled when services are created/updated via POST.

    // 1. Fetch all services from the 'services' collection
    // These are the universal services available to ALL monks
    const allServices = await db.collection("services").find({}).toArray();

    // 2. Get count of available monks for each service
    const monkCount = await db.collection("users").countDocuments({
      role: "monk",
      monkStatus: "approved"
    });

    // 3. Transform services to include availability information
    const servicesWithAvailability = allServices.map((svc: any) => ({
      ...svc,
      _id: svc._id.toString(),
      id: svc.id || svc._id.toString(),
      // All services are now universally available to all monks
      availableMonks: monkCount,
      isUniversal: true, // Flag indicating this service is available from any monk
      source: "universal", // All services are universal now
      // Ensure price is a number
      price: Number(svc.price)
    }));

    return NextResponse.json(servicesWithAvailability, { status: 200 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.publicMetadata.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only admins can create standard services" }, { status: 403 });
    }

    const {
      name,
      title,
      type,
      price,
      duration,
      desc,
      subtitle,
      image,
      quote,
      id
    } = await request.json();

    if (!price || !type) {
      return NextResponse.json({ error: "Missing required fields (price, type)" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Construct service object ensuring schema compliance
    const newService = {
      id: id || new ObjectId().toString(),
      name,
      title,
      type,
      price: Number(price),
      duration,
      desc,
      subtitle,
      image,
      quote,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("services").insertOne(newService);

    // Update ALL monks to include this new service in their services array
    // Instead of pushing, we need to rebuild the entire services array for all monks
    const allExistingServices = await db.collection("services").find({}).toArray();
    const allServiceRefs = allExistingServices.map((svc: any) => ({
      id: svc.id || svc._id.toString(),
      name: svc.name,
      title: svc.title,
      type: svc.type,
      price: svc.price,
      duration: svc.duration,
      desc: svc.desc,
      subtitle: svc.subtitle,
      image: svc.image,
      quote: svc.quote,
      status: 'active'
    }));

    // Update ALL monks with the complete updated services list
    await db.collection("users").updateMany(
      { role: "monk" },
      {
        $set: {
          services: allServiceRefs,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ message: "Service created", id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Service Creation Error:", error);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}