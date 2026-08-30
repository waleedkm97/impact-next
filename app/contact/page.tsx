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

export default function ContactPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main dir="rtl" className="container mx-auto max-w-4xl px-6 py-12">
      <section className="mb-10">
        <h1 className="text-4xl font-bold">
          نحن هنا لمساعدتك في اختيار المسار المناسب
        </h1>

        <p className="mt-4 text-muted-foreground">
          تواصل معنا وسيساعدك فريق Impact في اختيار الحل المناسب.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            تواصل معنا
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الجوال</Label>
              <Input id="phone" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea id="message" rows={6} required />
            </div>

            <Button type="submit">
              إرسال الرسالة
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}