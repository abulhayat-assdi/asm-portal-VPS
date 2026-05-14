/**
 * Firebase Firestore → PostgreSQL Migration Script
 *
 * Usage:
 *   node migrate-firebase-to-postgres.js [--collection=teachers] [--skip-users]
 *
 * Options:
 *   --collection=NAME   Migrate only this collection (default: all)
 *   --skip-users        Skip Firebase Auth user migration
 *   --dry-run           Print counts only, don't insert
 */

const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── Init ────────────────────────────────────────────────────────────────────
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf-8')
);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const firestoreDb = admin.firestore();
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const onlyCollection = args.find(a => a.startsWith('--collection='))?.split('=')[1];
const skipUsers = args.includes('--skip-users');
const dryRun = args.includes('--dry-run');

const TEMP_PASSWORD_HASH = bcrypt.hashSync('ChangeMe@123', 10);

// ── Helpers ─────────────────────────────────────────────────────────────────
function ts(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v?.toDate) return v.toDate();          // Firestore Timestamp
  if (typeof v === 'string') return new Date(v);
  return null;
}

function str(v, fallback = '') {
  if (v == null) return fallback;
  return String(v);
}

function num(v, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

function bool(v, fallback = false) {
  if (v == null) return fallback;
  return Boolean(v);
}

async function getAll(collectionName) {
  const snap = await firestoreDb.collection(collectionName).get();
  return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
}

function skip(name) {
  return onlyCollection && onlyCollection !== name;
}

let totalMigrated = 0;
let totalSkipped = 0;
let totalErrors = 0;

async function migrateCollection(name, docs, insertFn) {
  if (skip(name)) {
    console.log(`\n⏭  Skipping: ${name}`);
    return;
  }
  console.log(`\n📦 Migrating: ${name} (${docs.length} docs)`);
  if (dryRun) { console.log('   [dry-run] skipping inserts'); return; }

  let ok = 0, err = 0;
  for (const doc of docs) {
    try {
      await insertFn(doc);
      ok++;
    } catch (e) {
      err++;
      totalErrors++;
      console.error(`   ❌ ${doc._id}: ${e.message}`);
    }
  }
  totalMigrated += ok;
  console.log(`   ✅ ${ok} inserted, ❌ ${err} errors`);
}

// ── Enum mappers ─────────────────────────────────────────────────────────────
const USER_ROLES = ['super_admin', 'admin', 'teacher', 'student'];
function mapUserRole(r) {
  return USER_ROLES.includes(r) ? r : 'student';
}

const CLASS_STATUSES = ['PENDING', 'REQUEST_TO_COMPLETE', 'COMPLETED', 'UPCOMING'];
function mapClassStatus(s) {
  if (!s) return 'PENDING';
  const up = s.toUpperCase();
  return CLASS_STATUSES.includes(up) ? up : 'PENDING';
}

const SCHEDULE_STATUSES = ['Scheduled', 'Completed', 'Upcoming', 'Pending', 'Today', 'Requested'];
function mapScheduleStatus(s) {
  if (!s) return 'Scheduled';
  const found = SCHEDULE_STATUSES.find(x => x.toLowerCase() === s.toLowerCase());
  return found || 'Scheduled';
}

const BATCH_TYPES = ['Running', 'Completed'];
function mapBatchType(v) {
  return BATCH_TYPES.includes(v) ? v : 'Running';
}

const BATCH_STATUSES = ['active', 'archived'];
function mapBatchStatus(v) {
  return BATCH_STATUSES.includes(v) ? v : 'active';
}

const COURSE_STATUSES = ['Running', 'Completed', 'Incomplete', 'Expelled'];
function mapCourseStatus(v) {
  return COURSE_STATUSES.includes(v) ? v : 'Running';
}

const CURRENTLY_DOING = ['Job', 'Business', 'StudyingFurther', 'Nothing'];
function mapCurrentlyDoing(v) {
  if (!v) return null;
  return CURRENTLY_DOING.includes(v) ? v : null;
}

const STUDENT_CATS = ['Alim', 'General'];
function mapStudentCat(v) {
  if (!v) return null;
  return STUDENT_CATS.includes(v) ? v : null;
}

const FEEDBACK_STATUSES = ['APPROVED', 'PENDING'];
function mapFeedbackStatus(v) {
  if (!v) return 'PENDING';
  const up = v.toUpperCase();
  return FEEDBACK_STATUSES.includes(up) ? up : 'PENDING';
}

const MSG_STATUSES = ['unread', 'read', 'resolved'];
function mapMsgStatus(v) {
  if (!v) return 'unread';
  const lw = v.toLowerCase();
  return MSG_STATUSES.includes(lw) ? lw : 'unread';
}

const POST_STATUSES = ['draft', 'published'];
function mapPostStatus(v) {
  if (!v) return 'draft';
  const lw = v.toLowerCase();
  return POST_STATUSES.includes(lw) ? lw : 'draft';
}

const LEAVE_TYPES = ['Casual', 'Sick', 'WeeklyHoliday', 'Other'];
function mapLeaveType(v) {
  if (!v) return 'Casual';
  const found = LEAVE_TYPES.find(x => x.toLowerCase() === v.toLowerCase());
  return found || 'Other';
}

const RESOURCE_TYPES = ['Presentation', 'Notes', 'Assignment', 'Practice', 'Other'];
function mapResourceType(v) {
  if (!v) return 'Other';
  const found = RESOURCE_TYPES.find(x => x.toLowerCase() === v.toLowerCase());
  return found || 'Other';
}

// ── Migration functions ───────────────────────────────────────────────────────

async function migrateUsers() {
  if (skipUsers || (onlyCollection && onlyCollection !== 'users')) {
    console.log('\n⏭  Skipping: users (Firebase Auth)');
    return;
  }
  console.log('\n📦 Migrating: users (Firebase Auth)');
  if (dryRun) { console.log('   [dry-run] skipping inserts'); return; }

  let nextPageToken;
  let ok = 0, err = 0;

  do {
    const result = await admin.auth().listUsers(1000, nextPageToken);
    for (const u of result.users) {
      try {
        // Also try to get role from Firestore users collection
        let role = 'student';
        let teacherId = null;
        let studentBatchName = null;
        let studentRoll = null;
        let displayName = u.displayName || u.email?.split('@')[0] || 'User';
        let profileImageUrl = u.photoURL || null;

        try {
          const fsUser = await firestoreDb.collection('users').doc(u.uid).get();
          if (fsUser.exists) {
            const d = fsUser.data();
            role = mapUserRole(d.role);
            teacherId = d.teacherId || d.teacher_id || null;
            studentBatchName = d.studentBatchName || d.student_batch_name || null;
            studentRoll = d.studentRoll || d.student_roll || null;
            if (d.displayName) displayName = d.displayName;
            if (d.profileImageUrl) profileImageUrl = d.profileImageUrl;
          }
        } catch (_) {}

        await prisma.user.upsert({
          where: { id: u.uid },
          update: {},
          create: {
            id: u.uid,
            email: u.email || `${u.uid}@unknown.local`,
            passwordHash: TEMP_PASSWORD_HASH,
            displayName,
            role,
            teacherId,
            studentBatchName,
            studentRoll,
            profileImageUrl,
            createdAt: ts(u.metadata.creationTime) || new Date(),
            lastLoginAt: ts(u.metadata.lastSignInTime),
          },
        });
        ok++;
      } catch (e) {
        err++;
        totalErrors++;
        console.error(`   ❌ ${u.uid}: ${e.message}`);
      }
    }
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  totalMigrated += ok;
  console.log(`   ✅ ${ok} inserted/skipped, ❌ ${err} errors`);
  console.log('   ⚠️  All migrated users have temp password: ChangeMe@123');
}

async function migrateTeachers() {
  const docs = await getAll('teachers');
  await migrateCollection('teachers', docs, async (d) => {
    await prisma.teacher.upsert({
      where: { teacherId: str(d.teacherId || d.teacher_id || d._id) },
      update: {},
      create: {
        id: d._id,
        teacherId: str(d.teacherId || d.teacher_id || d._id),
        name: str(d.name, 'Unknown'),
        designation: str(d.designation),
        about: str(d.about),
        phone: str(d.phone),
        email: str(d.email),
        loginEmail: str(d.loginEmail || d.login_email),
        profileImageUrl: d.profileImageUrl || d.profile_image_url || null,
        isAdmin: bool(d.isAdmin || d.is_admin),
        order: num(d.order),
        leaveTrackingEnabled: bool(d.leaveTrackingEnabled || d.leave_tracking_enabled),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateBatches() {
  const docs = await getAll('batches');
  await migrateCollection('batches', docs, async (d) => {
    await prisma.batch.upsert({
      where: { name: str(d.name, d._id) },
      update: {},
      create: {
        id: d._id,
        name: str(d.name, d._id),
        status: mapBatchStatus(d.status),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateBatchStudents() {
  // Try flat collection first
  let docs = await getAll('batch_students');

  // If empty, try subcollections under each batch
  if (docs.length === 0) {
    const batches = await getAll('batches');
    for (const batch of batches) {
      const sub = await firestoreDb.collection('batches').doc(batch._id).collection('students').get();
      sub.docs.forEach(d => docs.push({ _id: d.id, batchName: batch.name, batchId: batch._id, ...d.data() }));
    }
  }

  await migrateCollection('batch_students', docs, async (d) => {
    const batchName = str(d.batchName || d.batch_name, 'Unknown');

    // Ensure batch exists
    await prisma.batch.upsert({
      where: { name: batchName },
      update: {},
      create: { name: batchName, status: 'active' },
    });

    const batch = await prisma.batch.findUnique({ where: { name: batchName } });

    await prisma.batchStudent.upsert({
      where: { batchName_roll: { batchName, roll: str(d.roll, d._id) } },
      update: {},
      create: {
        id: d._id,
        batchId: batch.id,
        batchName,
        roll: str(d.roll, d._id),
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

async function migrateClasses() {
  const docs = await getAll('classes');
  await migrateCollection('classes', docs, async (d) => {
    await prisma.class.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        teacherUid: str(d.teacherUid || d.teacher_uid || d.teacherId || ''),
        teacherName: str(d.teacherName || d.teacher_name, 'Unknown'),
        date: str(d.date, ''),
        startTime: str(d.startTime || d.start_time),
        endTime: str(d.endTime || d.end_time),
        timeRange: d.timeRange || d.time_range || d.time || null,
        batch: str(d.batch, ''),
        subject: str(d.subject, ''),
        status: mapClassStatus(d.status),
        completedByUid: d.completedByUid || d.completed_by_uid || null,
        completedAt: ts(d.completedAt || d.completed_at),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateClassSchedules() {
  const docs = await getAll('class_schedules');
  await migrateCollection('class_schedules', docs, async (d) => {
    await prisma.classSchedule.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        teacherId: str(d.teacherId || d.teacher_id, ''),
        teacherName: str(d.teacherName || d.teacher_name, 'Unknown'),
        date: str(d.date, ''),
        day: str(d.day),
        batch: str(d.batch, ''),
        subject: str(d.subject, ''),
        time: str(d.time),
        status: mapScheduleStatus(d.status),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateNotices() {
  const docs = await getAll('notices');
  await migrateCollection('notices', docs, async (d) => {
    await prisma.notice.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        title: str(d.title, 'Untitled'),
        description: str(d.description),
        date: str(d.date, ''),
        priority: str(d.priority, 'normal'),
        createdBy: d.createdBy || d.created_by || null,
        createdByName: d.createdByName || d.created_by_name || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateStudentNotices() {
  const docs = await getAll('student_notices');
  await migrateCollection('student_notices', docs, async (d) => {
    await prisma.studentNotice.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        title: str(d.title, 'Untitled'),
        description: str(d.description),
        date: str(d.date, ''),
        priority: str(d.priority, 'normal'),
        createdBy: d.createdBy || d.created_by || null,
        createdByName: d.createdByName || d.created_by_name || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateHomeworkSubmissions() {
  const docs = await getAll('homework_submissions');
  await migrateCollection('homework_submissions', docs, async (d) => {
    await prisma.homeworkSubmission.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        studentUid: str(d.studentUid || d.student_uid, ''),
        studentName: str(d.studentName || d.student_name, 'Unknown'),
        studentRoll: str(d.studentRoll || d.student_roll, ''),
        studentBatchName: str(d.studentBatchName || d.student_batch_name, ''),
        teacherName: str(d.teacherName || d.teacher_name, ''),
        subject: str(d.subject, ''),
        fileUrl: d.fileUrl || d.file_url || null,
        storagePath: d.storagePath || d.storage_path || null,
        fileName: d.fileName || d.file_name || null,
        files: d.files || null,
        textContent: d.textContent || d.text_content || null,
        submissionDate: str(d.submissionDate || d.submission_date, ''),
        assignmentId: d.assignmentId || d.assignment_id || null,
        submittedAt: ts(d.submittedAt || d.submitted_at) || new Date(),
        deletedAt: ts(d.deletedAt || d.deleted_at),
      },
    });
  });
}

async function migrateHomeworkAssignments() {
  const docs = await getAll('homework_assignments');
  await migrateCollection('homework_assignments', docs, async (d) => {
    await prisma.homeworkAssignment.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        teacherUid: str(d.teacherUid || d.teacher_uid, ''),
        teacherName: str(d.teacherName || d.teacher_name, ''),
        title: str(d.title, 'Untitled'),
        deadlineDate: str(d.deadlineDate || d.deadline_date, ''),
        batchName: str(d.batchName || d.batch_name, ''),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateFeedback() {
  const docs = await getAll('feedback');
  await migrateCollection('feedback', docs, async (d) => {
    await prisma.feedback.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        studentName: str(d.studentName || d.student_name, 'Anonymous'),
        batch: str(d.batch, ''),
        role: str(d.role),
        company: str(d.company),
        message: str(d.message, ''),
        rating: num(d.rating, 5),
        status: mapFeedbackStatus(d.status),
        submittedFrom: str(d.submittedFrom || d.submitted_from, 'PUBLIC_FORM'),
        approvedByUid: d.approvedByUid || d.approved_by_uid || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateContactMessages() {
  const docs = await getAll('contact_messages');
  await migrateCollection('contact_messages', docs, async (d) => {
    await prisma.contactMessage.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        subject: str(d.subject, '(no subject)'),
        message: str(d.message, ''),
        studentUid: str(d.studentUid || d.student_uid, ''),
        studentName: str(d.studentName || d.student_name, 'Unknown'),
        studentEmail: str(d.studentEmail || d.student_email, ''),
        studentBatchName: str(d.studentBatchName || d.student_batch_name, ''),
        studentRoll: str(d.studentRoll || d.student_roll, ''),
        status: mapMsgStatus(d.status),
        adminReply: d.adminReply || d.admin_reply || null,
        date: str(d.date, ''),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migratePosts() {
  const docs = await getAll('posts');
  const slugCounts = {};

  await migrateCollection('posts', docs, async (d) => {
    let slug = str(d.slug, d.title?.toLowerCase().replace(/\s+/g, '-') || d._id);
    // Deduplicate slugs
    if (slugCounts[slug]) {
      slugCounts[slug]++;
      slug = `${slug}-${slugCounts[slug]}`;
    } else {
      slugCounts[slug] = 1;
    }

    await prisma.post.upsert({
      where: { slug },
      update: {},
      create: {
        id: d._id,
        title: str(d.title, 'Untitled'),
        slug,
        excerpt: str(d.excerpt),
        featuredImage: d.featuredImage || d.featured_image || null,
        content: str(d.content, ''),
        category: d.category || null,
        metaTitle: d.metaTitle || d.meta_title || null,
        metaDescription: d.metaDescription || d.meta_description || null,
        keywords: d.keywords || null,
        status: mapPostStatus(d.status),
        publishedAt: ts(d.publishedAt || d.published_at),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateExamResults() {
  const docs = await getAll('exam_results');
  await migrateCollection('exam_results', docs, async (d) => {
    await prisma.examResult.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        studentUid: str(d.studentUid || d.student_uid, ''),
        studentName: str(d.studentName || d.student_name, 'Unknown'),
        studentRoll: str(d.studentRoll || d.student_roll, ''),
        studentBatchName: str(d.studentBatchName || d.student_batch_name, ''),
        subject: str(d.subject, ''),
        score: num(d.score),
        totalMarks: num(d.totalMarks || d.total_marks, 100),
        grade: d.grade || null,
        examDate: d.examDate || d.exam_date || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateRoutines() {
  const docs = await getAll('routines');
  await migrateCollection('routines', docs, async (d) => {
    await prisma.routine.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        batchName: str(d.batchName || d.batch_name, ''),
        fileUrl: str(d.fileUrl || d.file_url, ''),
        storagePath: str(d.storagePath || d.storage_path, ''),
        fileName: str(d.fileName || d.file_name, ''),
        uploadedBy: d.uploadedBy || d.uploaded_by || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migratePolicies() {
  const docs = await getAll('policies');
  await migrateCollection('policies', docs, async (d) => {
    await prisma.policy.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        title: str(d.title, 'Untitled'),
        content: str(d.content),
        category: d.category || null,
        isPublished: bool(d.isPublished ?? d.is_published),
        createdBy: d.createdBy || d.created_by || null,
        kind: str(d.kind, 'policy'),
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

async function migrateCmsContent() {
  const docs = await getAll('cms_content');
  await migrateCollection('cms_content', docs, async (d) => {
    const key = str(d.key, d._id);
    await prisma.cmsContent.upsert({
      where: { key },
      update: {},
      create: {
        id: d._id,
        key,
        value: d.value ?? d,
        updatedBy: d.updatedBy || d.updated_by || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateSuccessStories() {
  const docs = await getAll('success_stories');
  await migrateCollection('success_stories', docs, async (d) => {
    await prisma.successStory.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        name: str(d.name, 'Anonymous'),
        batch: str(d.batch, ''),
        role: str(d.role),
        company: str(d.company),
        story: str(d.story, ''),
        imageUrl: d.imageUrl || d.image_url || null,
        isPublished: bool(d.isPublished ?? d.is_published),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateVideoTestimonials() {
  const docs = await getAll('video_testimonials');
  await migrateCollection('video_testimonials', docs, async (d) => {
    await prisma.videoTestimonial.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        title: str(d.title, 'Untitled'),
        videoUrl: str(d.videoUrl || d.video_url, ''),
        thumbnailUrl: d.thumbnailUrl || d.thumbnail_url || null,
        description: d.description || null,
        isPublished: bool(d.isPublished ?? d.is_published),
        order: num(d.order),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateVideoStories() {
  const docs = await getAll('video_stories');
  await migrateCollection('video_stories', docs, async (d) => {
    await prisma.videoStory.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        youtubeUrl: str(d.youtubeUrl || d.youtube_url, ''),
        videoId: str(d.videoId || d.video_id, ''),
        title: str(d.title, 'Untitled'),
        label: str(d.label),
        studentName: str(d.studentName || d.student_name, ''),
        batch: str(d.batch),
        order: num(d.order),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateResources() {
  const docs = await getAll('resources');
  await migrateCollection('resources', docs, async (d) => {
    await prisma.resource.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        title: str(d.title, 'Untitled'),
        description: d.description || null,
        fileType: str(d.fileType || d.file_type, ''),
        fileName: str(d.fileName || d.file_name, ''),
        fileUrl: str(d.fileUrl || d.file_url, ''),
        storagePath: str(d.storagePath || d.storage_path, ''),
        fileSize: d.fileSize || d.file_size || null,
        uploadedBy: d.uploadedBy || d.uploaded_by || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateModuleFolders() {
  const docs = await getAll('module_folders');
  await migrateCollection('module_folders', docs, async (d) => {
    await prisma.moduleFolder.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        moduleId: str(d.moduleId || d.module_id, ''),
        moduleTitle: str(d.moduleTitle || d.module_title, ''),
        name: str(d.name, 'Untitled'),
        description: d.description || null,
        createdBy: d.createdBy || d.created_by || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateModuleResources() {
  const docs = await getAll('module_resources');
  await migrateCollection('module_resources', docs, async (d) => {
    await prisma.moduleResource.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        moduleId: str(d.moduleId || d.module_id, ''),
        moduleTitle: str(d.moduleTitle || d.module_title, ''),
        teacherName: str(d.teacherName || d.teacher_name, ''),
        teacherUid: str(d.teacherUid || d.teacher_uid, ''),
        folderId: d.folderId || d.folder_id || null,
        title: str(d.title, 'Untitled'),
        description: d.description || null,
        fileType: str(d.fileType || d.file_type, ''),
        fileName: str(d.fileName || d.file_name, ''),
        fileUrl: str(d.fileUrl || d.file_url, ''),
        storagePath: str(d.storagePath || d.storage_path, ''),
        fileSize: d.fileSize || d.file_size || null,
        resourceType: mapResourceType(d.resourceType || d.resource_type),
        visibleForBatches: d.visibleForBatches || d.visible_for_batches || ['all'],
        isHidden: bool(d.isHidden ?? d.is_hidden),
        uploadedAt: ts(d.uploadedAt || d.uploaded_at) || new Date(),
      },
    });
  });
}

async function migrateLeaves() {
  const docs = await getAll('leaves');
  await migrateCollection('leaves', docs, async (d) => {
    await prisma.leave.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        teacherId: str(d.teacherId || d.teacher_id, ''),
        teacherName: str(d.teacherName || d.teacher_name, ''),
        startDate: str(d.startDate || d.start_date, ''),
        endDate: str(d.endDate || d.end_date, ''),
        days: num(d.days, 1),
        type: mapLeaveType(d.type),
        reason: d.reason || null,
        monthYear: str(d.monthYear || d.month_year, ''),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateLeaveSettings() {
  const docs = await getAll('leave_settings');
  await migrateCollection('leave_settings', docs, async (d) => {
    const teacherId = str(d.teacherId || d.teacher_id, d._id);
    await prisma.leaveSettings.upsert({
      where: { teacherId },
      update: {},
      create: {
        id: d._id,
        teacherId,
        teacherName: str(d.teacherName || d.teacher_name, ''),
        weeklyHolidays: d.weeklyHolidays || d.weekly_holidays || [],
        joinDate: str(d.joinDate || d.join_date, ''),
        lastAutoGeneratedDate: d.lastAutoGeneratedDate || d.last_auto_generated_date || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateDailyTrackerReports() {
  const docs = await getAll('daily_tracker_reports');
  await migrateCollection('daily_tracker_reports', docs, async (d) => {
    await prisma.dailyTrackerReport.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        batchName: str(d.batchName || d.batch_name, ''),
        date: str(d.date, ''),
        reportData: d.reportData || d.report_data || {},
        submittedBy: d.submittedBy || d.submitted_by || null,
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateStudentUpdateRequests() {
  const docs = await getAll('student_update_requests');
  await migrateCollection('student_update_requests', docs, async (d) => {
    await prisma.studentUpdateRequest.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        studentUid: str(d.studentUid || d.student_uid, ''),
        studentName: str(d.studentName || d.student_name, ''),
        studentBatchName: str(d.studentBatchName || d.student_batch_name, ''),
        studentRoll: str(d.studentRoll || d.student_roll, ''),
        proposedChanges: d.proposedChanges || d.proposed_changes || {},
        currentData: d.currentData || d.current_data || {},
        status: str(d.status, 'pending'),
        adminNote: d.adminNote || d.admin_note || null,
        reviewedBy: d.reviewedBy || d.reviewed_by || null,
        reviewedAt: ts(d.reviewedAt || d.reviewed_at),
        submittedAt: ts(d.submittedAt || d.submitted_at) || new Date(),
      },
    });
  });
}

async function migrateBatchRoutineEntries() {
  const docs = await getAll('batch_routine_entries');
  await migrateCollection('batch_routine_entries', docs, async (d) => {
    await prisma.batchRoutineEntry.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        batch: str(d.batch, ''),
        dayOfWeek: str(d.dayOfWeek || d.day_of_week, ''),
        startTime: str(d.startTime || d.start_time, ''),
        endTime: str(d.endTime || d.end_time, ''),
        subject: str(d.subject, ''),
        teacherName: str(d.teacherName || d.teacher_name, ''),
        room: str(d.room),
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateStudentExamBatchRecords() {
  const docs = await getAll('student_exam_batch_records');
  await migrateCollection('student_exam_batch_records', docs, async (d) => {
    const batchName = str(d.batchName || d.batch_name, '');
    const roll = str(d.roll, '');
    await prisma.studentExamBatchRecord.upsert({
      where: { batchName_roll: { batchName, roll } },
      update: {},
      create: {
        id: d._id,
        batchName,
        roll,
        name: str(d.name, ''),
        data: d.data || {},
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

async function migrateChatThreads() {
  const docs = await getAll('chat_threads');
  await migrateCollection('chat_threads', docs, async (d) => {
    await prisma.chatThread.upsert({
      where: { studentUid: str(d.studentUid || d.student_uid, d._id) },
      update: {},
      create: {
        id: d._id,
        studentUid: str(d.studentUid || d.student_uid, d._id),
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
  });
}

async function migrateChatMessages() {
  // Try flat collection first
  let docs = await getAll('chat_messages');

  // If empty, try subcollections under each thread
  if (docs.length === 0) {
    const threads = await getAll('chat_threads');
    for (const thread of threads) {
      const sub = await firestoreDb.collection('chat_threads').doc(thread._id).collection('messages').get();
      sub.docs.forEach(d => docs.push({ _id: d.id, threadId: thread._id, ...d.data() }));
    }
  }

  await migrateCollection('chat_messages', docs, async (d) => {
    // Ensure thread exists
    const threadId = str(d.threadId || d.thread_id, '');
    if (!threadId) return;

    const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
    if (!thread) return; // orphaned message

    await prisma.chatMessage.upsert({
      where: { id: d._id },
      update: {},
      create: {
        id: d._id,
        threadId,
        senderId: d.senderId || d.sender_id || null,
        sender: str(d.sender, 'student'),
        text: str(d.text),
        attachments: d.attachments || [],
        createdAt: ts(d.createdAt) || new Date(),
      },
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Firebase → PostgreSQL Migration');
  console.log('====================================');
  if (dryRun) console.log('⚠️  DRY RUN MODE — no data will be inserted\n');
  if (onlyCollection) console.log(`🎯 Targeting collection: ${onlyCollection}\n`);

  await migrateUsers();
  await migrateTeachers();
  await migrateBatches();
  await migrateBatchStudents();
  await migrateClasses();
  await migrateClassSchedules();
  await migrateNotices();
  await migrateStudentNotices();
  await migrateHomeworkSubmissions();
  await migrateHomeworkAssignments();
  await migrateFeedback();
  await migrateContactMessages();
  await migratePosts();
  await migrateExamResults();
  await migrateRoutines();
  await migratePolicies();
  await migrateCmsContent();
  await migrateSuccessStories();
  await migrateVideoTestimonials();
  await migrateVideoStories();
  await migrateResources();
  await migrateModuleFolders();
  await migrateModuleResources();
  await migrateLeaves();
  await migrateLeaveSettings();
  await migrateDailyTrackerReports();
  await migrateStudentUpdateRequests();
  await migrateBatchRoutineEntries();
  await migrateStudentExamBatchRecords();
  await migrateChatThreads();
  await migrateChatMessages();

  console.log('\n====================================');
  console.log(`✅ Done! Migrated: ${totalMigrated} | Errors: ${totalErrors}`);
  if (totalErrors > 0) {
    console.log('⚠️  Some records had errors — check logs above');
  }
}

main()
  .catch(e => { console.error('\n💥 Fatal error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); process.exit(0); });
