import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSessionUser, isTeacherOrAdmin } from "@/lib/auth";
import { ensureCompetitionsTablesExist } from "@/lib/competitionsDb";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCompetitionsTablesExist();
    const { id } = await params;
    const decoded = await getServerSessionUser();
    
    if (!decoded || !isTeacherOrAdmin(decoded)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { submissions, deletedIds } = body;

    const compId = id;
    const competition = await prisma.competition.findUnique({ where: { id: compId } });
    
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    // Handle deletion of requested submission IDs
    if (Array.isArray(deletedIds) && deletedIds.length > 0) {
      await prisma.competitionSubmission.deleteMany({
        where: {
          id: { in: deletedIds },
          competitionId: compId
        }
      });
    }

    if (Array.isArray(submissions) && submissions.length > 0) {
      // Process upserts/updates & creates
      for (const sub of submissions) {
        if (sub.id) {
          // Update existing submission
          await prisma.competitionSubmission.update({
            where: { id: sub.id },
            data: {
              type: sub.teamName ? "team" : "individual",
              teamName: sub.teamName || null,
              rollNumber: sub.rollNumber,
              studentName: sub.studentName || "N/A",
              data: sub.data
            }
          }).catch(console.error);
        } else {
          // Create new submission
          await prisma.competitionSubmission.create({
            data: {
              competitionId: compId,
              type: sub.teamName ? "team" : "individual",
              teamName: sub.teamName || null,
              rollNumber: sub.rollNumber,
              studentName: sub.studentName || "N/A",
              data: sub.data
            }
          }).catch(console.error);
        }
      }
    }

    return NextResponse.json({ success: true, count: submissions?.length || 0 });
  } catch (error: any) {
    console.error("Error managing bulk submissions:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCompetitionsTablesExist();
    const { id: compId } = await params;
    const decoded = await getServerSessionUser();
    
    if (!decoded || !isTeacherOrAdmin(decoded)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json({ error: "Submission ID required" }, { status: 400 });
    }

    await prisma.competitionSubmission.delete({
      where: {
        id: submissionId,
        competitionId: compId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting submission:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
