-- CreateTable
CREATE TABLE "accounts" (
    "id" SERIAL NOT NULL,
    "private_key" TEXT NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_progress" (
    "id" SERIAL NOT NULL,
    "account" INTEGER,
    "progress" VARCHAR(8) NOT NULL,

    CONSTRAINT "accounts_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
    "id" SERIAL NOT NULL,
    "feature_name" TEXT NOT NULL,
    "feature_value" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "migrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_private_key_key" ON "accounts"("private_key");

-- CreateIndex
CREATE INDEX "idx_accounts_private_key" ON "accounts"("private_key");

-- CreateIndex
CREATE UNIQUE INDEX "unique_account" ON "accounts_progress"("account");

-- CreateIndex
CREATE INDEX "idx_accounts_progress_account_id" ON "accounts_progress"("account");

-- CreateIndex
CREATE UNIQUE INDEX "features_feature_name_key" ON "features"("feature_name");

-- AddForeignKey
ALTER TABLE "accounts_progress" ADD CONSTRAINT "accounts_progress_account_id_fkey" FOREIGN KEY ("account") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
