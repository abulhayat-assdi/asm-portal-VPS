import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/sse/chat/[threadId]
 * SSE stream for messages in a specific student↔admin chat thread.
 * Replaces Firestore subscribeToChatMessages in contactService.
 *
 * threadId = studentUid (matching the ChatThread.studentUid field)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ threadId: string }> }
) {
    const user = await getSessionUser(request);
    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { threadId } = await params;

    // Students can only see their own thread
    if (user.role === "student" && user.id !== threadId) {
        return new Response("Forbidden", { status: 403 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const send = async () => {
                try {
                    // Find the thread first
                    const thread = await prisma.chatThread.findUnique({
                        where: { studentUid: threadId },
                    });

                    if (!thread) {
                        const data = JSON.stringify([]);
                        controller.enqueue(encoder.encode(`event: messages\ndata: ${data}\n\n`));
                        return;
                    }

                    const messages = await prisma.chatMessage.findMany({
                        where: { threadId: thread.id },
                        orderBy: { createdAt: "asc" },
                        select: {
                            id: true,
                            sender: true,
                            text: true,
                            attachments: true,
                            createdAt: true,
                        },
                    });

                    // Always send full message list (client replaces state)
                    const data = JSON.stringify(
                        messages.map((m: any) => ({
                            id: m.id,
                            sender: m.sender,
                            text: m.text,
                            attachments: m.attachments,
                            createdAt: m.createdAt.toISOString(),
                        }))
                    );

                    controller.enqueue(encoder.encode(`event: messages\ndata: ${data}\n\n`));
                } catch (err) {
                    console.error("[SSE Chat] Error:", err);
                }
            };

            send();
            const intervalId = setInterval(send, 3000); // Poll every 3 seconds for chat (lower latency)

            const pingId = setInterval(() => {
                controller.enqueue(encoder.encode(`: ping\n\n`));
            }, 25000);

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
            "X-Accel-Buffering": "no",
        },
    });
}
