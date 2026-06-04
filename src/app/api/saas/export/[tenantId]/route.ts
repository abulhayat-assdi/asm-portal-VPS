export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, isSaasOwner } from '@/lib/auth';
import archiver from 'archiver';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

function resolveLocalFile(storagePath: string, publicDir: string): string | null {
    if (!storagePath) return null;
    const relative = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
    const abs = path.resolve(publicDir, relative);
    if (!abs.startsWith(publicDir + path.sep) && abs !== publicDir) return null;
    return abs;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ tenantId: string }> }
) {
    const user = await getSessionUser(req);
    if (!user || !isSaasOwner(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tenantId } = await params;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // ── সব টেবিল থেকে tenant-এর ডেটা ──────────────────────────────────────
    const [
        users, teachers, classes, classSchedules, batches, batchStudents,
        notices, studentNotices, homeworkSubmissions, homeworkAssignments,
        feedback, contactMessages, chatThreads, activityLogs, resources,
        moduleFolders, moduleResources, posts, examResults, routines,
        policies, cmsContent, successStories, videoTestimonials,
        dailyTrackerReports, studentUpdateRequests, batchRoutineEntries,
        routineConfigs, studentExamBatchRecords, courseModules, videoStories,
    ] = await Promise.all([
        prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true, tenantId: true, email: true, displayName: true,
                role: true, teacherId: true, studentBatchName: true,
                studentRoll: true, profileImageUrl: true, permissions: true,
                createdAt: true, updatedAt: true, lastLoginAt: true,
            },
        }),
        prisma.teacher.findMany({ where: { tenantId } }),
        prisma.class.findMany({ where: { tenantId } }),
        prisma.classSchedule.findMany({ where: { tenantId } }),
        prisma.batch.findMany({ where: { tenantId } }),
        prisma.batchStudent.findMany({ where: { tenantId } }),
        prisma.notice.findMany({ where: { tenantId } }),
        prisma.studentNotice.findMany({ where: { tenantId } }),
        prisma.homeworkSubmission.findMany({ where: { tenantId } }),
        prisma.homeworkAssignment.findMany({ where: { tenantId } }),
        prisma.feedback.findMany({ where: { tenantId } }),
        prisma.contactMessage.findMany({ where: { tenantId } }),
        prisma.chatThread.findMany({ where: { tenantId } }),
        prisma.activityLog.findMany({ where: { tenantId } }),
        prisma.resource.findMany({ where: { tenantId } }),
        prisma.moduleFolder.findMany({ where: { tenantId } }),
        prisma.moduleResource.findMany({ where: { tenantId } }),
        prisma.post.findMany({ where: { tenantId } }),
        prisma.examResult.findMany({ where: { tenantId } }),
        prisma.routine.findMany({ where: { tenantId } }),
        prisma.policy.findMany({ where: { tenantId } }),
        prisma.cmsContent.findMany({ where: { tenantId } }),
        prisma.successStory.findMany({ where: { tenantId } }),
        prisma.videoTestimonial.findMany({ where: { tenantId } }),
        prisma.dailyTrackerReport.findMany({ where: { tenantId } }),
        prisma.studentUpdateRequest.findMany({ where: { tenantId } }),
        prisma.batchRoutineEntry.findMany({ where: { tenantId } }),
        prisma.routineConfig.findMany({ where: { tenantId } }),
        prisma.studentExamBatchRecord.findMany({ where: { tenantId } }),
        prisma.courseModule.findMany({ where: { tenantId } }),
        prisma.videoStory.findMany({ where: { tenantId } }),
    ]);

    // ── Related tables ────────────────────────────────────────────────────────
    const threadIds = chatThreads.map((t) => t.id);
    const chatMessages = threadIds.length
        ? await prisma.chatMessage.findMany({ where: { threadId: { in: threadIds } } })
        : [];

    const postIds = posts.map((p) => p.id);
    const blogComments = postIds.length
        ? await prisma.blogComment.findMany({ where: { postId: { in: postIds } } })
        : [];

    const teacherIds = teachers.map((t) => t.teacherId);
    const [leaves, leaveSettings] = teacherIds.length
        ? await Promise.all([
            prisma.leave.findMany({ where: { teacherId: { in: teacherIds } } }),
            prisma.leaveSettings.findMany({ where: { teacherId: { in: teacherIds } } }),
        ])
        : [[], []];

    const userIds = users.map((u) => u.id);
    const cvDrafts = userIds.length
        ? await prisma.cvDraft.findMany({ where: { userId: { in: userIds } }, include: { versions: true } })
        : [];

    // ── JSON payload ──────────────────────────────────────────────────────────
    const exportPayload = {
        exportedAt: new Date().toISOString(),
        tenant: {
            id: tenant.id, slug: tenant.slug, name: tenant.name,
            tagline: tenant.tagline, plan: tenant.plan, status: tenant.status,
            primaryColor: tenant.primaryColor, accentColor: tenant.accentColor,
            ownerName: tenant.ownerName, ownerEmail: tenant.ownerEmail,
            ownerPhone: tenant.ownerPhone, settings: tenant.settings,
            createdAt: tenant.createdAt,
        },
        summary: {
            users: users.length, teachers: teachers.length,
            batches: batches.length, students: batchStudents.length,
            classes: classes.length, homeworkSubmissions: homeworkSubmissions.length,
            feedbacks: feedback.length, notices: notices.length,
            posts: posts.length, resources: resources.length,
            cvDrafts: cvDrafts.length,
        },
        tables: {
            users, teachers, leaves, leaveSettings,
            classes, classSchedules, batches, batchStudents,
            notices, studentNotices, homeworkSubmissions, homeworkAssignments,
            feedback, contactMessages, chatThreads, chatMessages,
            activityLogs, resources, moduleFolders, moduleResources,
            posts, blogComments, examResults, routines, policies, cmsContent,
            successStories, videoTestimonials, dailyTrackerReports,
            studentUpdateRequests, batchRoutineEntries, routineConfigs,
            studentExamBatchRecords, courseModules, videoStories, cvDrafts,
        },
    };

    // ── Local ফাইল সংগ্রহ ────────────────────────────────────────────────────
    const fileMap = new Map<string, string>();
    const publicDir = path.join(process.cwd(), 'public');

    const addFile = (storagePath: string | null | undefined, zipFolder: string) => {
        if (!storagePath) return;
        const abs = resolveLocalFile(storagePath, publicDir);
        if (!abs || !fs.existsSync(abs)) return;
        const rel = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
        const key = `files/${zipFolder}/${path.basename(rel)}`;
        if (!fileMap.has(key)) fileMap.set(key, abs);
    };

    const addImage = (url: string | null | undefined, folder: string) => {
        if (!url || url.startsWith('http')) return;
        addFile(url, folder);
    };

    homeworkSubmissions.forEach((s) => {
        addFile(s.storagePath, `homework/${s.studentBatchName}/${s.studentRoll}`);
        if (Array.isArray(s.files)) {
            (s.files as Array<{ storagePath?: string }>).forEach((f) =>
                addFile(f.storagePath, `homework/${s.studentBatchName}/${s.studentRoll}`)
            );
        }
    });
    resources.forEach((r) => addFile(r.storagePath, 'resources'));
    moduleResources.forEach((r) => addFile(r.storagePath, `module-resources/${r.moduleTitle}`));
    routines.forEach((r) => addFile(r.storagePath, `routines/${r.batchName}`));
    policies.forEach((p) => addFile(p.storagePath, 'policies'));
    users.forEach((u) => addImage(u.profileImageUrl, 'profile-images/users'));
    teachers.forEach((t) => addImage(t.profileImageUrl, 'profile-images/teachers'));
    batchStudents.forEach((s) => addImage(s.photo, `student-photos/${s.batchName}`));
    successStories.forEach((s) => addImage(s.imageUrl, 'success-story-images'));
    cvDrafts.forEach((c) => addImage(c.profilePhoto, 'cv-photos'));

    // ── ZIP তৈরি ─────────────────────────────────────────────────────────────
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.append(JSON.stringify(exportPayload, null, 2), { name: 'data.json' });
    for (const [zipPath, absPath] of fileMap) {
        archive.file(absPath, { name: zipPath });
    }
    archive.finalize();

    // Node.js Readable → Web ReadableStream (Next.js 15 / Node 18+)
    const webStream = Readable.toWeb(archive as unknown as Readable) as ReadableStream<Uint8Array>;

    const filename = `${tenant.slug}-export-${new Date().toISOString().split('T')[0]}.zip`;

    return new NextResponse(webStream, {
        status: 200,
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
