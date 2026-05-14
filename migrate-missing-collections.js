/**
 * Migrate missing Firebase collections to PostgreSQL
 * Fixes collection name mismatches from initial migration
 */
const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf-8')
);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();
const prisma = new PrismaClient();

function ts(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v?.toDate) return v.toDate();
  if (typeof v === 'string') return new Date(v);
  return null;
}
function str(v, fallback = '') { return v == null ? fallback : String(v); }
function num(v, fallback = 0) { const n = parseFloat(v); return isNaN(n) ? fallback : n; }
function bool(v, fallback = false) { return v == null ? fallback : Boolean(v); }

async function getAll(col) {
  const snap = await db.collection(col).get();
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}

const BATCH_TYPES = ['Running', 'Completed'];
const COURSE_STATUSES = ['Running', 'Completed', 'Incomplete', 'Expelled'];
const CURRENTLY_DOING = ['Job', 'Business', 'StudyingFurther', 'Nothing'];
const STUDENT_CATS = ['Alim', 'General'];

function mapBatchType(v) { return BATCH_TYPES.includes(v) ? v : 'Running'; }
function mapCourseStatus(v) { return COURSE_STATUSES.includes(v) ? v : 'Running'; }
function mapCurrentlyDoing(v) { if (!v) return null; return CURRENTLY_DOING.includes(v) ? v : null; }
function mapStudentCat(v) { if (!v) return null; return STUDENT_CATS.includes(v) ? v : null; }
function mapBatchStatus(v) { return ['active','archived'].includes(v) ? v : 'active'; }

let totalOk = 0, totalErr = 0;

async function run(name, docs, fn) {
  console.log(`\n📦 ${name} (${docs.length} docs)`);
  let ok = 0, err = 0;
  for (const d of docs) {
    try { await fn(d); ok++; }
    catch (e) { err++; totalErr++; console.error(`  ❌ ${d._id}: ${e.message.split('\n')[0]}`); }
  }
  totalOk += ok;
  console.log(`  ✅ ${ok} inserted, ❌ ${err} errors`);
}

// ── 1. batch_info → batch_students ───────────────────────────
async function migrateBatchInfo() {
  const docs = await getAll('batch_info');
  await run('batch_info → batch_students', docs, async (d) => {
    const batchName = str(d.batchName || d.batch_name || d.batch, 'Unknown');
    const roll = str(d.roll || d.id || d._id, '');

    await prisma.batch.upsert({
      where: { name: batchName },
      update: {},
      create: { name: batchName, status: mapBatchStatus(d.batchStatus) },
    });
    const batch = await prisma.batch.findUnique({ where: { name: batchName } });

    await prisma.batchStudent.upsert({
      where: { batchName_roll: { batchName, roll } },
      update: {},
      create: {
        id: d._id,
        batchId: batch.id,
        batchName,
        roll,
        name: str(d.name, 'Unknown'),
        phone: str(d.phone),
        address: str(d.address),
        dob: d.dob ? str(d.dob) : null,
        educationalDegree: d.educationalDegree || d.educational_degree || null,
        category: mapStudentCat(d.category),
        bloodGroup: d.bloodGroup || d.blood_group || null,
        totalPaidTk: d.totalPaidTk || d.total_paid_tk || null,
        courseStatus: mapCourseStatus(d.courseStatus || d.course_status),
        currentlyDoing: mapCurrentlyDoing(d.currentlyDoing || d.currently_doing),
        companyName: str(d.companyName || d.company_name),
        businessName: str(d.businessName || d.business_name),
        salary: num(d.salary),
        batchType: mapBatchType(d.batchType || d.batch_type),
        isPublic: bool(d.isPublic ?? d.is_public ?? true),
        createdAt: ts(d.createdAt) || new Date(),
        completedAt: ts(d.completedAt || d.completed_at),
      },
    });
  });
}

// ── 2. batch_routines → batch_routine_entries ─────────────────
async function migrateBatchRoutines() {
  const docs = await getAll('batch_routines');
  await run('batch_routines → batch_routine_entries', docs, async (d) => {
    await prisma.batchRoutineEntry.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        batch: str(d.batch || d.batchName || d.batch_name, ''),
        dayOfWeek: str(d.dayOfWeek || d.day_of_week || d.day, ''),
        startTime: str(d.startTime || d.start_time || d.time?.split('-')[0] || ''),
        endTime: str(d.endTime || d.end_time || d.time?.split('-')[1] || ''),
        subject: str(d.subject, ''),
        teacherName: str(d.teacherName || d.teacher_name, ''),
        room: str(d.room),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

// ── 3. homeVideoTestimonials → video_testimonials ─────────────
async function migrateHomeVideoTestimonials() {
  const docs = await getAll('homeVideoTestimonials');
  await run('homeVideoTestimonials → video_testimonials', docs, async (d) => {
    await prisma.videoTestimonial.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        title: str(d.title, 'Untitled'),
        videoUrl: str(d.videoUrl || d.video_url || d.url, ''),
        thumbnailUrl: d.thumbnailUrl || d.thumbnail_url || null,
        description: d.description || null,
        isPublished: bool(d.isPublished ?? d.is_published ?? true),
        order: num(d.order),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

// ── 4. successVideos → video_stories ─────────────────────────
async function migrateSuccessVideos() {
  const docs = await getAll('successVideos');
  await run('successVideos → video_stories', docs, async (d) => {
    await prisma.videoStory.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        youtubeUrl: str(d.youtubeUrl || d.youtube_url || d.url, ''),
        videoId: str(d.videoId || d.video_id || '', ''),
        title: str(d.title, 'Untitled'),
        label: str(d.label),
        studentName: str(d.studentName || d.student_name || d.name, ''),
        batch: str(d.batch),
        order: num(d.order),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

// ── 5. successReviews → success_stories ──────────────────────
async function migrateSuccessReviews() {
  const docs = await getAll('successReviews');
  await run('successReviews → success_stories', docs, async (d) => {
    await prisma.successStory.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        name: str(d.name || d.studentName, 'Anonymous'),
        batch: str(d.batch, ''),
        role: str(d.role),
        company: str(d.company),
        story: str(d.story || d.message || d.review, ''),
        imageUrl: d.imageUrl || d.image_url || null,
        isPublished: bool(d.isPublished ?? d.is_published ?? true),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

// ── 6. meeting_minutes → policies (kind='meeting') ────────────
async function migrateMeetingMinutes() {
  const docs = await getAll('meeting_minutes');
  await run('meeting_minutes → policies', docs, async (d) => {
    await prisma.policy.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        title: str(d.title, 'Untitled'),
        content: str(d.content),
        category: d.category || null,
        isPublished: bool(d.isPublished ?? d.is_published ?? true),
        createdBy: d.createdBy || null,
        kind: 'meeting',
        fileUrl: str(d.fileUrl || d.file_url),
        storagePath: str(d.storagePath || d.storage_path),
        version: str(d.version),
        meetingNumber: str(d.meetingNumber || d.meeting_number),
        date: str(d.date),
        sortOrder: num(d.sortOrder || d.sort_order),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

// ── 7. student_profile_updates → student_update_requests ──────
async function migrateStudentProfileUpdates() {
  const docs = await getAll('student_profile_updates');
  await run('student_profile_updates → student_update_requests', docs, async (d) => {
    await prisma.studentUpdateRequest.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        studentUid: str(d.studentUid || d.student_uid || d.userId, ''),
        studentName: str(d.studentName || d.student_name || d.name, ''),
        studentBatchName: str(d.studentBatchName || d.student_batch_name || d.batch, ''),
        studentRoll: str(d.studentRoll || d.student_roll || d.roll, ''),
        proposedChanges: d.proposedChanges || d.proposed_changes || d.changes || {},
        currentData: d.currentData || d.current_data || {},
        status: str(d.status, 'pending'),
        adminNote: d.adminNote || d.admin_note || null,
        reviewedBy: d.reviewedBy || d.reviewed_by || null,
        reviewedAt: ts(d.reviewedAt || d.reviewed_at),
        submittedAt: ts(d.submittedAt || d.submitted_at || d.createdAt) || new Date(),
      },
    });
  });
}

// ── 8. admin_chats → chat_threads + messages ──────────────────
async function migrateAdminChats() {
  const docs = await getAll('admin_chats');
  await run('admin_chats → chat_threads', docs, async (d) => {
    await prisma.chatThread.upsert({
      where: { studentUid: str(d.studentUid || d.student_uid || d._id) },
      update: {},
      create: {
        id: d._id,
        studentUid: str(d.studentUid || d.student_uid || d._id),
        studentName: str(d.studentName || d.student_name, 'Unknown'),
        studentEmail: str(d.studentEmail || d.student_email, ''),
        studentBatchName: str(d.studentBatchName || d.student_batch_name, ''),
        studentRoll: str(d.studentRoll || d.student_roll, ''),
        lastMessageText: str(d.lastMessageText || d.last_message_text),
        lastMessageTime: ts(d.lastMessageTime || d.last_message_time) || new Date(),
        unreadCountAdmin: num(d.unreadCountAdmin ?? d.unread_count_admin),
        unreadCountStudent: num(d.unreadCountStudent ?? d.unread_count_student),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });

    // Migrate subcollection messages
    const msgSnap = await db.collection('admin_chats').doc(d._id).collection('messages').get();
    for (const msg of msgSnap.docs) {
      const m = { _id: msg.id, ...msg.data() };
      try {
        await prisma.chatMessage.upsert({
          where: { id: m._id },
          update: {},
          create: {
            id: m._id,
            threadId: d._id,
            senderId: m.senderId || m.sender_id || null,
            sender: str(m.sender, 'student'),
            text: str(m.text || m.message),
            attachments: m.attachments || [],
            createdAt: ts(m.createdAt) || new Date(),
          },
        });
      } catch (e) {
        console.error(`  ❌ msg ${m._id}: ${e.message.split('\n')[0]}`);
      }
    }
  });
}

// ── 9. public_batch_students (skip if same as batch_info) ─────
async function migratePublicBatchStudents() {
  const docs = await getAll('public_batch_students');
  // Only migrate if different from batch_info
  await run('public_batch_students → batch_students (public)', docs, async (d) => {
    const batchName = str(d.batchName || d.batch_name || d.batch, 'Unknown');
    const roll = str(d.roll || d._id, '');

    await prisma.batch.upsert({
      where: { name: batchName },
      update: {},
      create: { name: batchName, status: 'active' },
    });
    const batch = await prisma.batch.findUnique({ where: { name: batchName } });

    await prisma.batchStudent.upsert({
      where: { batchName_roll: { batchName, roll } },
      update: { isPublic: true },
      create: {
        id: d._id,
        batchId: batch.id,
        batchName,
        roll,
        name: str(d.name, 'Unknown'),
        phone: str(d.phone),
        address: str(d.address),
        dob: d.dob ? str(d.dob) : null,
        educationalDegree: d.educationalDegree || null,
        category: mapStudentCat(d.category),
        bloodGroup: d.bloodGroup || null,
        totalPaidTk: d.totalPaidTk || null,
        courseStatus: mapCourseStatus(d.courseStatus || d.course_status),
        currentlyDoing: mapCurrentlyDoing(d.currentlyDoing),
        companyName: str(d.companyName),
        businessName: str(d.businessName),
        salary: num(d.salary),
        batchType: mapBatchType(d.batchType || d.batch_type),
        isPublic: true,
        createdAt: ts(d.createdAt) || new Date(),
        completedAt: ts(d.completedAt),
      },
    });
  });
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Missing Collections Migration\n');

  await migrateBatchInfo();
  await migratePublicBatchStudents();
  await migrateBatchRoutines();
  await migrateHomeVideoTestimonials();
  await migrateSuccessVideos();
  await migrateSuccessReviews();
  await migrateMeetingMinutes();
  await migrateStudentProfileUpdates();
  await migrateAdminChats();

  console.log(`\n====================================`);
  console.log(`✅ Done! Migrated: ${totalOk} | Errors: ${totalErr}`);
}

main()
  .catch(e => { console.error('💥 Fatal:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); process.exit(0); });
