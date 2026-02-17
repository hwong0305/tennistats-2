-- CreateTable
CREATE TABLE "utr_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "recorded_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utr_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "utr_history_user_id_recorded_at_idx" ON "utr_history"("user_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "utr_history" ADD CONSTRAINT "utr_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
