-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" TEXT[],
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT,
    "order" INTEGER NOT NULL,
    "points" INTEGER,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_order_idx" ON "AssessmentQuestion"("assessmentId", "order");

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "CourseAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
