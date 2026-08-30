import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicTrainingDetailsPage() {
  return (
    <main dir="rtl" className="container mx-auto px-6 py-12">
      <section className="mb-10">
        <h1 className="text-4xl font-bold">
          عنوان البرنامج
        </h1>

        <p className="mt-4 text-muted-foreground">
          تفاصيل البرنامج التدريبي العام.
        </p>

        <Button
          className="mt-6"
          nativeButton={false}
          render={<Link href="/training-booking" />}
        >
          التسجيل في البرنامج
        </Button>
      </section>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>نظرة عامة</CardTitle>
          </CardHeader>

          <CardContent>
            معلومات عامة عن البرنامج وأهدافه.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تفاصيل البرنامج</CardTitle>
          </CardHeader>

          <CardContent>
            مدة البرنامج، المحاور، المدرب، والمعلومات التنظيمية.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>هيكل البرنامج</CardTitle>
          </CardHeader>

          <CardContent>
            سيتم عرض هيكل البرنامج والمحاور التدريبية.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}