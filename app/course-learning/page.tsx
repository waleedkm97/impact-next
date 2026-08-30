"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const lessons = [
  "مقدمة الدورة",
  "أساسيات البيع",
  "فهم احتياجات العميل",
  "التعامل مع الاعتراضات",
  "إغلاق الصفقة",
  "تحويل الفرص إلى نتائج",
  "تطبيق عملي",
  "الاختبار النهائي",
];

export default function CourseLearningPage() {
  const [currentLesson, setCurrentLesson] = useState(0);

  const progress =
    ((currentLesson + 1) / lessons.length) * 100;

  return (
    <main dir="rtl" className="container mx-auto px-6 py-8">
      <h1 className="mb-6 text-3xl font-bold">
        التدريب
      </h1>

      <div className="mb-8">
        <Progress value={progress} />

        <p className="mt-2 text-sm text-muted-foreground">
          {Math.round(progress)}% مكتمل
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-6 aspect-video rounded-xl bg-black" />

          <Card>
            <CardHeader>
              <CardTitle>
                {lessons[currentLesson]}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">
                محتوى الدرس التدريبي سيظهر هنا.
              </p>

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  disabled={currentLesson === 0}
                  onClick={() =>
                    setCurrentLesson((value) =>
                      Math.max(0, value - 1)
                    )
                  }
                >
                  السابق
                </Button>

                <Button
                  disabled={currentLesson === lessons.length - 1}
                  onClick={() =>
                    setCurrentLesson((value) =>
                      Math.min(lessons.length - 1, value + 1)
                    )
                  }
                >
                  الدرس التالي
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>
                المحتوى التدريبي
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson}
                  onClick={() => setCurrentLesson(index)}
                  className={`w-full rounded-lg p-3 text-right text-sm ${
                    index === currentLesson
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {index + 1}. {lesson}
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}