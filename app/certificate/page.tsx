import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CertificatePage() {
  return (
    <main
      dir="rtl"
      className="container mx-auto flex min-h-[80vh] items-center justify-center px-6 py-12"
    >
      <Card className="w-full max-w-4xl">
        <CardContent className="p-10">
          <div className="border-8 border-double p-12 text-center">
            <p className="mb-6 text-lg">
              شهادة إتمام
            </p>

            <h1 className="mb-8 text-4xl font-bold">
              IMPACT Training
            </h1>

            <p className="mb-4">
              تشهد المنصة بأن
            </p>

            <h2 className="mb-6 text-3xl font-bold">
              اسم المتدرب
            </h2>

            <p className="mb-10">
              قد أتم بنجاح البرنامج التدريبي
            </p>

            <h3 className="mb-10 text-2xl font-semibold">
              اسم الدورة
            </h3>

            <div className="flex justify-between text-sm">
              <span>التاريخ</span>
              <span>رقم الشهادة</span>
            </div>
          </div>

          <Button className="mt-8 w-full">
            طباعة الشهادة
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}