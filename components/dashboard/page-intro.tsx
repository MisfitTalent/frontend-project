"use client";

import { Typography } from "antd";

import { usePageModule } from "@/providers/pageProviders";

export function PageIntro() {
  const page = usePageModule();

  return (
    <div className="space-y-2">
      <Typography.Title className="!mb-0 !text-slate-900" level={2}>
        {page.title}
      </Typography.Title>
      <Typography.Paragraph className="!mb-0 max-w-3xl !text-slate-500">
        {page.description}
      </Typography.Paragraph>
    </div>
  );
}
