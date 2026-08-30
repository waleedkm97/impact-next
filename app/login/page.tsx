"use client";

import { FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // سنربطه لاحقًا بنظام Authentication
  }

  return (
    <main dir="rtl" className="container mx-auto flex min-h-[80vh] items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">
            مرحبًا بك
          </CardTitle>

          <p className="text-sm text-muted-foreground">
            سجل الدخول إلى حسابك
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">
                البريد الإلكتروني
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                كلمة المرور
              </Label>

              <Input
                id="password"
                type="password"
                required
              />
            </div>

            <Button className="w-full" type="submit">
              تسجيل الدخول
            </Button>

            <div className="text-center text-sm">
              <Link
                href="/account"
                className="text-primary hover:underline"
              >
                حسابي
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}