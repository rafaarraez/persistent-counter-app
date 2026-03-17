-- CreateTable
CREATE TABLE "counter" (
    "id" SERIAL NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counter_pkey" PRIMARY KEY ("id")
);
