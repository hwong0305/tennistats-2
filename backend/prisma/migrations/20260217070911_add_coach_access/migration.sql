-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'coach');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('pending', 'accepted', 'declined');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'student';

-- CreateTable
CREATE TABLE "coach_invites" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "coach_id" INTEGER,
    "coach_email" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_comments" (
    "id" SERIAL NOT NULL,
    "journal_entry_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_comments" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_comments" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coach_invites_coach_email_idx" ON "coach_invites"("coach_email");

-- CreateIndex
CREATE UNIQUE INDEX "coach_invites_student_id_coach_email_key" ON "coach_invites"("student_id", "coach_email");

-- CreateIndex
CREATE INDEX "journal_comments_journal_entry_id_idx" ON "journal_comments"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_comments_student_id_idx" ON "journal_comments"("student_id");

-- CreateIndex
CREATE INDEX "match_comments_match_id_idx" ON "match_comments"("match_id");

-- CreateIndex
CREATE INDEX "match_comments_student_id_idx" ON "match_comments"("student_id");

-- CreateIndex
CREATE INDEX "profile_comments_student_id_idx" ON "profile_comments"("student_id");

-- AddForeignKey
ALTER TABLE "coach_invites" ADD CONSTRAINT "coach_invites_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_invites" ADD CONSTRAINT "coach_invites_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_comments" ADD CONSTRAINT "journal_comments_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_comments" ADD CONSTRAINT "journal_comments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_comments" ADD CONSTRAINT "journal_comments_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "tennis_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_comments" ADD CONSTRAINT "match_comments_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_comments" ADD CONSTRAINT "profile_comments_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
