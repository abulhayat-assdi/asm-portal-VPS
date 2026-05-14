-- Step 1: Update all super_admin users to admin
UPDATE "User" SET role = 'admin' WHERE role = 'super_admin';

-- Step 2: Remove super_admin from the enum
-- PostgreSQL does not support DROP VALUE, so we rename the type and recreate it
ALTER TYPE "UserRole" RENAME TO "UserRole_old";

CREATE TYPE "UserRole" AS ENUM ('admin', 'teacher', 'student');

ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole" USING role::text::"UserRole";

DROP TYPE "UserRole_old";
