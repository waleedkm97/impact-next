import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CourseDetailsPage() {
  return (
    <main dir="rtl" className="container mx-auto px-6 py-12">
      <section className="mb-12 grid gap-10 lg:grid-cols-2">
        <div>
          <Badge className="mb-4">
            دورة مسجلة
          </Badge>

          <h1 className="mb-5 text-4xl font-bold">
            مهارات البيع وتحويل الفرص لنتائج ملموسة
          </h1>

          <p className="mb-8 text-lg text-muted-foreground">
            دورة تدريبية عملية تساعدك على تطوير مهارات البيع وتحسين
            قدرتك على تحويل الفرص إلى نتائج ملموسة.
          </p>

          <div className="flex gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/checkout" />}
            >
              التسجيل في الدورة
            </Button>

            <Button variant="outline" size="lg">
              إضافة للسلة
            </Button>
          </div>
        </div>

        <div className="aspect-video rounded-2xl bg-muted" />
      </section>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>نظرة عامة</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground">
              محتوى تدريبي مصمم لتطوير مهارات البيع والتفاوض والتعامل
              مع العملاء.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أهداف التعلم</CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="list-disc space-y-2 pr-6">
              <li>فهم مراحل عملية البيع.</li>
              <li>تحسين مهارات التواصل مع العملاء.</li>
              <li>التعامل مع الاعتراضات.</li>
              <li>تحويل الفرص إلى نتائج.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الفئة المستهدفة</CardTitle>
          </CardHeader>

          <CardContent>
            <p>
              موظفو المبيعات، مسؤولو تطوير الأعمال، وخدمة العملاء.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              محتوى الدورة (8 فيديوهات مسجلة)
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4"
                >
                  الفيديو {index + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}