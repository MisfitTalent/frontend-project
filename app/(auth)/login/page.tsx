"use client";

import Link from "next/link";
import { Typography } from "antd";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(242,140,40,0.16),_transparent_26%),linear-gradient(135deg,_#eef3f8,_#f8fafc_50%,_#eef3f8)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="space-y-6">
          <Typography.Title className="!mb-0 !text-5xl !leading-tight" level={1}>
            Close the visibility gap in enterprise sales.
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 max-w-2xl !text-lg !text-slate-600">
            AutoSales unifies opportunities, proposals, pricing requests, activities, and renewals into one operational workflow.
          </Typography.Paragraph>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Track long B2B cycles",
              "Coordinate proposals faster",
              "Prevent renewal leakage",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/70 bg-white/70 px-4 py-4 backdrop-blur">
                <Typography.Text strong>{item}</Typography.Text>
              </div>
            ))}
          </div>
        </section>

        <section className="flex justify-center">
          <div className="w-full max-w-md space-y-5">
            <LoginForm />
            <Typography.Paragraph className="!mb-0 text-center !text-slate-500">
              New workspace? <Link href="/register">Create an account</Link>
            </Typography.Paragraph>
          </div>
        </section>
      </div>
    </main>
  );
}
