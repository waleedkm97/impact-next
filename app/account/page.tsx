import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountPage() {
  return (
    <main dir="rtl" className="container mx-auto px-6 py-12">
      <h1 className="mb-10 text-4xl font-bold">
        حساب المتدرب
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>بياناتي</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground">
              إدارة بيانات الحساب والمعلومات الشخصية.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>دوراتي</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground">
              عرض الدورات المسجل بها المتدرب.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>شهاداتي</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-muted-foreground">
              عرض شهادات إتمام البرامج والدورات.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}