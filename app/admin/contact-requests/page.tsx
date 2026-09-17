"use client";

import { useEffect, useState } from "react";

type ContactRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "new" | "read" | "replied" | "closed";
  createdAt: string;
  updatedAt: string;
};

const statusLabels: Record<ContactRequest["status"], string> = {
  new: "جديد",
  read: "تمت القراءة",
  replied: "تم الرد",
  closed: "مغلق",
};

export default function ContactRequestsPage() {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadRequests() {
    try {
      const response = await fetch("/api/contact");
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests ?? []);
      }
    } catch (error) {
      console.error("Failed to load contact requests:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  async function updateStatus(
    id: string,
    status: ContactRequest["status"],
  ) {
    setUpdatingId(id);

    try {
      const response = await fetch("/api/contact", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "تعذر تحديث حالة الطلب.",
        );
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to update contact request:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "تعذر تحديث حالة الطلب.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  if (loading) {
    return (
      <main dir="rtl" className="p-8">
        <h1 className="text-2xl font-bold">
          طلبات التواصل
        </h1>

        <p className="mt-4 text-muted-foreground">
          جاري تحميل الطلبات...
        </p>
      </main>
    );
  }

  return (
    <main dir="rtl" className="p-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            طلبات التواصل
          </h1>

          <p className="mt-2 text-muted-foreground">
            جميع الرسائل المرسلة من نموذج التواصل في الموقع.
          </p>
        </div>

        <div className="rounded-lg border bg-card px-5 py-3 text-center">
          <div className="text-2xl font-bold">
            {requests.filter(
              (item) => item.status === "new",
            ).length}
          </div>

          <div className="text-xs text-muted-foreground">
            طلبات جديدة
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">
            لا توجد طلبات تواصل
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            عندما يرسل أحد العملاء نموذج التواصل سيظهر هنا.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold">
                      {item.name}
                    </h2>

                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {statusLabels[item.status]}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div>
                      <span className="font-medium">
                        البريد:
                      </span>{" "}
                      <a
                        href={`mailto:${item.email}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {item.email}
                      </a>
                    </div>

                    {item.phone && (
                      <div>
                        <span className="font-medium">
                          الجوال:
                        </span>{" "}
                        <a
                          href={`tel:${item.phone}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {item.phone}
                        </a>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </div>
                  </div>

                  <div className="mt-5 rounded-lg bg-muted/50 p-4">
                    <div className="mb-2 text-sm font-semibold">
                      الرسالة
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-7">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 lg:w-44">
                  <a
                    href={`mailto:${item.email}`}
                    className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                  >
                    الرد عبر البريد
                  </a>

                  {item.phone && (
                    <a
                      href={`https://wa.me/${item.phone.replace(
                        /\D/g,
                        "",
                      ).replace(/^05/, "9665")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                    >
                      فتح واتساب
                    </a>
                  )}

                  <select
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={(event) =>
                      void updateStatus(
                        item.id,
                        event.target
                          .value as ContactRequest["status"],
                      )
                    }
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="new">جديد</option>
                    <option value="read">
                      تمت القراءة
                    </option>
                    <option value="replied">
                      تم الرد
                    </option>
                    <option value="closed">مغلق</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}