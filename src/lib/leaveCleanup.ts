import fs from "fs";
import path from "path";
import { prisma } from "./db";

/**
 * Automatically clean up physical attachment files and clear attachment URLs
 * for student leave requests of a batch that has been marked as Completed.
 * All text records of leave requests (dates, reason, status, reviewNote) remain intact.
 */
export async function cleanupBatchLeaveAttachments(batchName: string): Promise<number> {
    try {
        const leaveRequestsWithAttachments = await prisma.studentLeaveRequest.findMany({
            where: {
                studentBatchName: batchName,
                attachmentUrl: { not: null },
            },
            select: {
                id: true,
                attachmentUrl: true,
            },
        });

        if (leaveRequestsWithAttachments.length === 0) {
            return 0;
        }

        const storageBase = process.env.LOCAL_STORAGE_PATH || process.env.UPLOAD_DIR || path.resolve(process.cwd(), "public");

        for (const req of leaveRequestsWithAttachments) {
            if (req.attachmentUrl) {
                try {
                    // Extract relative path from URL (e.g. /api/uploads/student-leaves/filename -> student-leaves/filename)
                    const cleanUrl = req.attachmentUrl.startsWith("/") ? req.attachmentUrl.slice(1) : req.attachmentUrl;
                    const relativePath = cleanUrl.replace(/^api\/uploads\//, "");
                    const filePath = path.resolve(storageBase, relativePath);

                    if (fs.existsSync(filePath)) {
                        await fs.promises.unlink(filePath);
                    }
                } catch (unlinkErr) {
                    console.warn(`[LeaveCleanup] Could not unlink attachment file for request ${req.id}:`, unlinkErr);
                }
            }
        }

        // Reset attachment fields in database while keeping text records intact
        const updateResult = await prisma.studentLeaveRequest.updateMany({
            where: {
                studentBatchName: batchName,
                attachmentUrl: { not: null },
            },
            data: {
                attachmentUrl: null,
                attachmentName: null,
            },
        });

        return updateResult.count;
    } catch (error) {
        console.error(`[LeaveCleanup] Error cleaning up attachments for batch "${batchName}":`, error);
        return 0;
    }
}
