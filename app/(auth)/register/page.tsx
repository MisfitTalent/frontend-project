"use client";

import Link from "next/link";
import { Typography } from "antd";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,_#f8fafc,_#eef3f8_45%,_#fde6cc)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="space-y-6">
          <Typography.Title className="!mb-0 !text-5xl !leading-tight" level={1}>
            Build a sales workspace around accountability.
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 max-w-2xl !text-lg !text-slate-600">
            Launch a shared workspace for your team and centralise business development, proposals, pricing, and contract visibility.
          </Typography.Paragraph>
          <div className="space-y-4">
            {[
              "Role-aware access for admins, sales managers, and reps",
              "Structured follow-up workflows across the entire pipeline",
              "One shared view of renewals, deadlines, and reporting",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 backdrop-blur">
                <Typography.Text>{item}</Typography.Text>
              </div>
            ))}
          </div>
        </section>

        <section className="flex justify-center">
          <div className="w-full max-w-2xl space-y-5">
            <RegisterForm />
            <Typography.Paragraph className="!mb-0 text-center !text-slate-500">
              Already registered? <Link href="/login">Sign in instead</Link>
            </Typography.Paragraph>
          </div>
        </section>
      </div>
    </main>
  );
}
