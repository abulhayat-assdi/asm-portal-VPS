import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/sse/notifications
 * SSE stream — pushes pending feedback count + any other sidebar notifications
 * Replaces Firestore onSnapshot in feedbackService.subscribeToPendingFeedback
 */
export async function GET(request: NextRequest) {
    const user = await getSessionUser(request);
    if (!user || !isAdmin(user)) {
        return new Response("Unauthorized", { status: 401 });
    }

    const encoder = new TextEncoder();
    let intervalId: ReturnType<typeof setInterval>;

    const stream = new ReadableStream({
        start(controller) {
            const send = async () => {
                try {
                    const pendingFeedback = await prisma.feedback.findMany({
                        where: { status: "PENDING" },
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            studentName: true,
                            batch: true,
                            message: true,
                            rating: true,
                            status: true,
                            createdAt: true,
                            submittedFrom: true,
                        },
                    });

                    const pendingClasses = await prisma.class.count({
                        where: { status: { in: ["PENDING", "REQUEST_TO_COMPLETE"] } },
                    });

                    const data = JSON.stringify({
                        pendingFeedback,
                        pendingFeedbackCount: pendingFeedback.length,
                        pendingClassesCount: pendingClasses,
                    });

                    controller.enqueue(encoder.encode(`event: feedback\ndata: ${data}\n\n`));
                } catch (err) {
                    console.error("[SSE Notifications] Error:", err);
                }
            };

            // Send immediately
            send();
            // Then every 10 seconds
            intervalId = setInterval(send, 10000);

            // Keep-alive ping every 25 seconds (prevents proxy timeouts)
            const pingId = setInterval(() => {
                controller.enqueue(encoder.encode(`: ping\n\n`));
            }, 25000);

            // Cleanup when client disconnects
            request.signal.addEventListener("abort", () => {
                clearInterval(intervalId);
                clearInterval(pingId);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // Disable Nginx buffering
        },
    });
}
