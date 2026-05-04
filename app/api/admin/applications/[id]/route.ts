import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { Resend } from "resend";
import { executeAdminOperation, validateUserData, checkDataConsistency, adminGuard } from "@/lib/admin-utils";
import { logSuccess, logFailure, createOperationContext } from "@/lib/admin-logger";

const resend = new Resend(process.env.RESEND_API_KEY);

type Props = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, props: Props) {
    try {
        const { id } = await props.params;

        // 1. Validate ID
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({
                success: false,
                message: "Invalid application ID format",
                error: "INVALID_ID_FORMAT"
            }, { status: 400 });
        }

        // 2. Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            return NextResponse.json({
                success: false,
                message: "Invalid JSON in request body",
                error: "INVALID_JSON"
            }, { status: 400 });
        }

        const { action } = body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({
                success: false,
                message: "Invalid action. Must be 'approve' or 'reject'",
                error: "INVALID_ACTION"
            }, { status: 400 });
        }

        // 3. Connect to database
        let db;
        try {
            const connection = await connectToDatabase();
            db = connection.db;
        } catch (dbError) {
            console.error("Database connection failed:", dbError);
            return NextResponse.json({
                success: false,
                message: "Database connection failed",
                error: "DATABASE_CONNECTION_ERROR"
            }, { status: 500 });
        }

        // 4. Fetch the applicant data
        let applicant;
        try {
            applicant = await db.collection("users").findOne({ _id: new ObjectId(id) });
        } catch (fetchError: any) {
            console.error("Failed to fetch applicant:", fetchError);
            return NextResponse.json({
                success: false,
                message: "Failed to fetch applicant data",
                error: "APPLICANT_FETCH_FAILED",
                details: fetchError.message
            }, { status: 500 });
        }

        if (!applicant) {
            return NextResponse.json({
                success: false,
                message: "Applicant not found",
                error: "APPLICANT_NOT_FOUND"
            }, { status: 404 });
        }

        // 5. Check admin access (Clerk OR Bearer JWT for mobile)
        const { adminUser: guardUser, errorResponse: guardError } = await adminGuard(request);
        if (guardError) return guardError;
        const user = guardUser;
        const adminId = user._id?.toString();

        // 6. Validate applicant state
        if (applicant.role === 'monk' && applicant.monkStatus === 'approved') {
            logFailure(
                createOperationContext("Application Processing", adminId || undefined, id, "application"),
                "approve already approved applicant",
                "ALREADY_APPROVED"
            );
            return NextResponse.json({
                success: false,
                message: "Applicant is already approved as a monk",
                error: "ALREADY_APPROVED"
            }, { status: 400 });
        }

        // 7. Data consistency check
        const consistency = await checkDataConsistency('approve_monk', { userId: id });
        if (!consistency.consistent) {
            console.warn("Data consistency warnings for monk approval:", consistency.warnings);
            // Log warnings but proceed with operation
        }

        // 8. Validate applicant data completeness
        const applicantValidation = validateUserData(applicant);
        if (!applicantValidation.valid) {
            logFailure(
                createOperationContext("Application Processing", adminId || undefined, id, "application"),
                "approve applicant with invalid data",
                applicantValidation.errors.join(", ")
            );
            return NextResponse.json({
                success: false,
                message: "Applicant data is incomplete or invalid",
                error: "INVALID_APPLICANT_DATA",
                details: applicantValidation.errors
            }, { status: 400 });
        }

        if (action === 'approve') {
            // --- A. Database Updates with Transaction-like Behavior ---

            const operationContext = createOperationContext("Application Processing", adminId || undefined, id, "application");

            // 8. Fetch all services from the services collection
            let allServices;
            try {
                allServices = await db.collection("services").find({}).toArray();
            } catch (servicesFetchError: any) {
                console.error("Failed to fetch services:", servicesFetchError);
                logFailure(
                    operationContext,
                    `Failed to fetch services for ${action}`,
                    servicesFetchError.message
                );
                return NextResponse.json({
                    success: false,
                    message: "Failed to fetch available services",
                    error: "SERVICES_FETCH_FAILED",
                    details: servicesFetchError.message
                }, { status: 500 });
            }

            if (allServices.length === 0) {
                logFailure(
                    operationContext,
                    "approve monk with no services available",
                    "NO_SERVICES_AVAILABLE"
                );
                return NextResponse.json({
                    success: false,
                    message: "No services available. Please create services first.",
                    error: "NO_SERVICES_AVAILABLE"
                }, { status: 400 });
            }

            // Map services to the format expected in user.services array
            // Include ALL service details for comprehensive monk profiles
            const serviceRefs = allServices.map((svc: any) => ({
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

            // 9. Execute monk approval as a transactional operation
            const monkProfile = {
                userId: applicant._id,
                clerkId: applicant.clerkId,
                email: applicant.email,
                name: applicant.name || { mn: "", en: "" },
                title: applicant.title || { mn: "", en: "" },
                image: applicant.image || "",
                bio: applicant.bio || { mn: "", en: "" },
                specialties: applicant.specialties || [],
                services: serviceRefs,
                yearsOfExperience: applicant.yearsOfExperience || 0,
                education: applicant.education || { mn: "", en: "" },
                philosophy: applicant.philosophy || { mn: "", en: "" },
                rating: 5.0,
                isAvailable: true,
                isVerified: true,
                schedule: [],
                blockedSlots: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const approvalResult = await executeAdminOperation(
                `Monk Approval for ${applicant._id}`,
                [
                    // Update user role and services
                    {
                        collection: "users",
                        operation: "update",
                        query: { _id: new ObjectId(id) },
                        data: {
                            $set: {
                                role: "monk",
                                monkStatus: "approved",
                                services: serviceRefs,
                                updatedAt: new Date()
                            }
                        }
                    },
                    // Create/update monk profile
                    {
                        collection: "monks",
                        operation: "update",
                        query: { userId: applicant._id },
                        data: { $set: monkProfile },
                        options: { upsert: true }
                    }
                ]
            );

            if (!approvalResult.success) {
                logFailure(
                    operationContext,
                    "approve application",
                    approvalResult.error || "Unknown error during approval"
                );
                return NextResponse.json({
                    success: false,
                    message: "Failed to approve monk application",
                    error: "MONK_APPROVAL_FAILED",
                    details: approvalResult.error
                }, { status: 500 });
            }

            logSuccess(
                operationContext,
                "approve application",
                {
                    servicesAssigned: serviceRefs.length,
                    monkProfileCreated: true
                }
            );

            // --- B. Send Approval Email ---
            let emailSent = false;
            if (applicant.email) {
                try {
                    // Determine the name to greet them with (English or first available)
                    const greetingName = applicant.name?.en || applicant.name?.mn || "Guide";

                    await resend.emails.send({
                        from: "Nirvana Team <onboarding@resend.dev>", // Update this once you verify your domain
                        to: applicant.email,
                        subject: "Congratulations! Your Monk Application is Approved",
                        html: `
                        <div style="font-family: sans-serif; color: #451a03; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h1 style="color: #D97706; margin: 0;">Welcome to the Community</h1>
                            </div>

                            <p>Dear <strong>${greetingName}</strong>,</p>

                            <p>We are honored to accept your application. Your profile has been reviewed and is now <strong>live</strong> on the Nirvana platform.</p>

                            <p>You can now log in to your dashboard to:</p>
                            <ul>
                                <li>Set your weekly schedule</li>
                                <li>Manage your service offerings</li>
                                <li>Accept rituals and video calls</li>
                            </ul>

                            <br/>

                            <div style="text-align: center;">
                                <a href="${process.env.NEXT_PUBLIC_URL}/profile" style="background-color: #D97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                    Go to Profile
                                </a>
                            </div>

                            <br/><br/>
                            <hr style="border: 0; border-top: 1px solid #eee;" />
                            <p style="font-size: 12px; color: #888; text-align: center;">
                                Nirvana Spiritual Platform<br/>
                                <em>Connecting Wisdom & Technology</em>
                            </p>
                        </div>
                    `
                    });
                    emailSent = true;
                    console.log(`Approval email sent to ${applicant.email}`);
                } catch (emailError) {
                    console.error("Failed to send approval email:", emailError);
                }
            }

            // --- C. Send Push Notification ---
            try {
                const { sendPushToUser } = await import("@/lib/pushService");
                await sendPushToUser({
                    userId: id,
                    title: "🎉 Таны өргөдөл батлагдлаа!",
                    body: "Та одоо Гэвабал дээр засал хийх боломжтой боллоо.",
                    data: { type: "monk_approval", approved: "true" }
                });
            } catch (pushErr) {
                console.error("Push Notification for monk approval failed:", pushErr);
            }

            // 8. Log successful approval
            console.log(`Applicant ${id} approved successfully:`, {
                userId: id,
                email: applicant.email,
                servicesAssigned: serviceRefs.length,
                emailSent
            });

            return NextResponse.json({
                success: true,
                message: `Application approved successfully. Monk now has access to all ${serviceRefs.length} universal services.`,
                data: {
                    applicantId: id,
                    newRole: "monk",
                    servicesAssigned: serviceRefs.length,
                    emailSent,
                    monkProfileCreated: true,
                    universalServices: true
                }
            });

        } else if (action === 'reject') {
            // --- Handle Rejection with Transaction-like Behavior ---

            const operationContext = createOperationContext("Application Processing", adminId || undefined, id, "application");

            // 6. Execute monk rejection as a transactional operation
            const rejectionResult = await executeAdminOperation(
                `Monk Rejection for ${applicant._id}`,
                [
                    // Update user status
                    {
                        collection: "users",
                        operation: "update",
                        query: { _id: new ObjectId(id) },
                        data: {
                            $set: {
                                monkStatus: "rejected",
                                updatedAt: new Date()
                            }
                        }
                    },
                    // Remove monk profile if it exists (cleanup)
                    {
                        collection: "monks",
                        operation: "delete",
                        query: { userId: new ObjectId(id) }
                    }
                ]
            );

            if (!rejectionResult.success) {
                logFailure(
                    operationContext,
                    "reject application",
                    rejectionResult.error || "Unknown error during rejection"
                );
                return NextResponse.json({
                    success: false,
                    message: "Failed to reject monk application",
                    error: "MONK_REJECTION_FAILED",
                    details: rejectionResult.error
                }, { status: 500 });
            }

            logSuccess(
                operationContext,
                "reject application",
                { monkProfileCleaned: true }
            );

            // 8. Send Rejection Email
            let emailSent = false;
            if (applicant.email) {
                try {
                    const greetingName = applicant.name?.en || applicant.name?.mn || "Applicant";

                    await resend.emails.send({
                        from: "Nirvana Team <onboarding@resend.dev>",
                        to: applicant.email,
                        subject: "Update regarding your Monk Application",
                        html: `
                        <div style="font-family: sans-serif; color: #451a03; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <p>Dear ${greetingName},</p>
                            <p>Thank you for your interest in joining Nirvana as a guide.</p>
                            <p>After careful review, we are unable to move forward with your application at this time. This may be due to incomplete profile information or current capacity limits.</p>
                            <p>You may update your profile information and apply again in the future.</p>
                            <br/>
                            <p style="font-size: 12px; color: #888;">Nirvana Spiritual Platform</p>
                        </div>
                    `
                    });
                    emailSent = true;
                    console.log(`Rejection email sent to ${applicant.email}`);
                } catch (emailError) {
                    console.error("Failed to send rejection email:", emailError);
                    // Don't fail operation for email errors
                }
            }

            // 9. Log successful rejection
            console.log(`Applicant ${id} rejected successfully:`, {
                userId: id,
                email: applicant.email,
                emailSent,
                monkProfileCleaned: true
            });

            return NextResponse.json({
                success: true,
                message: "Application rejected successfully",
                data: {
                    applicantId: id,
                    newStatus: "rejected",
                    emailSent,
                    monkProfileCleaned: true
                }
            });
        }

        // Invalid action
        return NextResponse.json({
            success: false,
            message: "Invalid action specified",
            error: "INVALID_ACTION"
        }, { status: 400 });

    } catch (error: any) {
        console.error("Admin Application PATCH Error:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error during application processing",
            error: "INTERNAL_SERVER_ERROR",
            details: error.message
        }, { status: 500 });
    }
}