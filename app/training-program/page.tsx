import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TrainingProgramPage() {
  return (
    <main dir="rtl" className="container mx-auto px-6 py-12">
      <section className="mb-12">
        <h1 className="text-4xl font-bold">
          عنوان البرنامج
        </h1>

        <p className="mt-4 text-muted-foreground">
          وصف البرنامج التدريبي ومعلوماته الأساسية.
        </p>

        <Button
          className="mt-6"
          nativeButton={false}
          render={<Link href="/training-booking" />}
        >
          حجز البرنامج
        </Button>
      </section>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>
              مواد البرنامج والتقييمات
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p>
              سيتم عرض المواد التدريبية والتقييمات الخاصة بالبرنامج.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              تقييم الدورة التدريبية
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p>
              يمكن للمتدرب تقييم تجربته التدريبية بعد إتمام البرنامج.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}