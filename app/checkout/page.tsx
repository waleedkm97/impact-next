"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckoutPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // لاحقًا:
    // إنشاء Order
    // ثم Payment Gateway
  }

  return (
    <main dir="rtl" className="container mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-10 text-4xl font-bold">
        حجز الدورة
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        <Card>
          <CardHeader>
            <CardTitle>
              بيانات المتدرب
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">
                  الاسم الكامل
                </Label>

                <Input id="name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  البريد الإلكتروني
                </Label>

                <Input id="email" type="email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  رقم الجوال
                </Label>

                <Input id="phone" required />
              </div>

              <Button className="w-full" type="submit">
                تأكيد الحجز
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              ملخص الطلب
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                مهارات البيع وتحويل الفرص لنتائج ملموسة
              </div>

              <div className="flex justify-between border-t pt-4">
                <span>الإجمالي</span>
                <strong>299 ريال</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}