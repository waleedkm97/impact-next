"use client";

import { FormEvent, useEffect, useState } from "react";
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

type ContactSettings = {
  email?: string;
  phone?: string;
  whatsapp?: string;
};

export default function ContactPage() {
  const [contact, setContact] = useState<ContactSettings>({});
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (data.success) {
          setContact(data.settings?.contact ?? {});
        }
      } catch (error) {
        console.error("Failed to load contact settings:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "تعذر إرسال الرسالة. حاول مرة أخرى.",
        );
      }

      setSuccessMessage(
        "تم إرسال رسالتك بنجاح. سنتواصل معك في أقرب وقت.",
      );

      form.reset();
    } catch (error) {
      console.error("Failed to submit contact form:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "تعذر إرسال الرسالة. حاول مرة أخرى.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function getWhatsAppUrl() {
    if (!contact.whatsapp) {
      return "#";
    }

    let number = contact.whatsapp.replace(/\D/g, "");

    if (number.startsWith("05")) {
      number = `966${number.substring(1)}`;
    }

    return `https://wa.me/${number}`;
  }

  return (
    <main dir="rtl" className="container mx-auto max-w-5xl px-6 py-12">
      {/* Header */}
      <section className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          نحن هنا لمساعدتك
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          تواصل معنا وسيساعدك فريق Impact في اختيار الحل التدريبي المناسب
          لاحتياجك.
        </p>
      </section>

      {/* Contact Information */}
      {!loading && (
        <section className="mb-10 grid gap-5 md:grid-cols-3">
          {/* Email */}
          {contact.email && (
            <Card className="h-full">
              <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
                  @
                </div>

                <h2 className="text-lg font-semibold">البريد الإلكتروني</h2>

                <a
                  href={`mailto:${contact.email}`}
                  className="mt-2 break-all text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {contact.email}
                </a>
              </CardContent>
            </Card>
          )}

          {/* Phone */}
          {contact.phone && (
            <Card className="h-full">
              <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
                  T
                </div>

                <h2 className="text-lg font-semibold">رقم الجوال</h2>

                <a
                  href={`tel:${contact.phone}`}
                  className="mt-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {contact.phone}
                </a>
              </CardContent>
            </Card>
          )}

          {/* WhatsApp */}
          {contact.whatsapp && (
            <Card className="h-full">
              <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
                  W
                </div>

                <h2 className="text-lg font-semibold">واتساب</h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  تواصل معنا مباشرة عبر واتساب
                </p>

                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#25D366] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  تواصل عبر واتساب
                </a>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">أرسل لنا رسالة</CardTitle>

          <p className="text-sm text-muted-foreground">
            املأ النموذج وسيتواصل معك فريقنا في أقرب وقت.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" name="name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الجوال</Label>
              <Input id="phone" name="phone" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">الرسالة</Label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                required
              />
            </div>

            {successMessage && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={submitting}
            >
              {submitting ? "جاري الإرسال..." : "إرسال الرسالة"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}