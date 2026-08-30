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
import { Textarea } from "@/components/ui/textarea";

export default function TrainingBookingPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main dir="rtl" className="container mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold">
        حجز البرنامج
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>
            بيانات الحجز
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                الاسم
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

            <div className="space-y-2">
              <Label htmlFor="notes">
                ملاحظات
              </Label>
              <Textarea id="notes" />
            </div>

            <Button type="submit" className="w-full">
              إرسال طلب الحجز
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}