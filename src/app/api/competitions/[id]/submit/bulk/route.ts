import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSessionUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = await getServerSessionUser();
    
    if (!decoded || (decoded.role !== "admin" && decoded.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { submissions } = body;

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return NextResponse.json({ error: "No submissions provided" }, { status: 400 });
    }

    const compId = id;
    const competition = await prisma.competition.findUnique({ where: { id: compId } });
    
    if (!competition) return NextResponse.json({ error: "Competition not found" }, { status: 404 });

    const createData = submissions.map(sub => ({
      competitionId: compId,
      type: sub.teamName ? "team" : "individual",
      teamName: sub.teamName || null,
      rollNumber: sub.rollNumber,
      studentName: sub.studentName || "N/A",
      data: sub.data
    }));

    await prisma.competitionSubmission.createMany({
      data: createData,
      skipDuplicates: true
    });

    return NextResponse.json({ success: true, count: createData.length });
  } catch (error: any) {
    console.error("Error bulk inserting submissions:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
