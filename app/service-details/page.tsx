import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServiceDetailsPage() {
  return (
    <main dir="rtl" className="container mx-auto px-6 py-12">
      <h1 className="mb-10 text-4xl font-bold">
        تفاصيل الخدمة
      </h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>عن الخدمة</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground">
              نقدم خدمة متكاملة يتم تصميمها وفق احتياجات المنشأة.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أهداف الخدمة</CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="list-disc space-y-2 pr-6">
              <li>رفع كفاءة الموظفين.</li>
              <li>تحسين الأداء.</li>
              <li>تطوير المهارات.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مراحل تنفيذ الخدمة</CardTitle>
          </CardHeader>

          <CardContent>
            <ol className="list-decimal space-y-2 pr-6">
              <li>تحليل الاحتياج.</li>
              <li>تصميم الحل.</li>
              <li>التنفيذ.</li>
              <li>التقييم والمتابعة.</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المخرجات</CardTitle>
          </CardHeader>

          <CardContent>
            خطة وحلول تدريبية قابلة للتنفيذ والقياس.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الفئات المستفيدة</CardTitle>
          </CardHeader>

          <CardContent>
            المؤسسات والفرق والموظفون.
          </CardContent>
        </Card>

        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>
              هل تحتاج هذه الخدمة؟
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Button
              nativeButton={false}
              render={<Link href="/contact" />}
            >
              تواصل معنا
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}