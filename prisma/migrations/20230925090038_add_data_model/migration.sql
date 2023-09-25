/*
  Warnings:

  - Made the column `account` on table `accounts_progress` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "accounts_progress" ALTER COLUMN "account" SET NOT NULL;

-- CreateTable
CREATE TABLE "accounts_data" (
    "id" SERIAL NOT NULL,
    "account" INTEGER NOT NULL,
    "lesson_id" VARCHAR(8) NOT NULL,
    "data" JSONB,

    CONSTRAINT "accounts_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_data_account_lesson_id_key" ON "accounts_data"("account", "lesson_id");

-- RenameIndex
ALTER INDEX "unique_account" RENAME TO "accounts_progress_account_key";
