"use client";

import Link from "next/link";
import { Button, Card, Col, Row, Tag } from "antd";
import { Typography } from "antd";

const heroCards = [
  {
    copy: "Kanban and list-based tracking across long-running B2B deals.",
    title: "Opportunity pipeline",
  },
  {
    copy: "Structured turnaround and internal accountability for commercial responses.",
    title: "Proposal workflows",
  },
  {
    copy: "Proactive alerts for expiring agreements and business-critical deadlines.",
    title: "Renewal monitoring",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(242,140,40,0.16),_transparent_24%),linear-gradient(160deg,_#eef3f8,_#f8fafc_45%,_#eef3f8)] px-4 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl flex-col justify-center gap-10">
        <div className="max-w-4xl space-y-6">
          <Tag color="#355c7d">AutoSales</Tag>
          <Typography.Title className="!mb-0 !text-5xl !leading-tight md:!text-6xl" level={1}>
            A sales automation workspace built for complex enterprise cycles.
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 max-w-3xl !text-lg !text-slate-600">
            Replace scattered spreadsheets and informal follow-up with one platform for opportunities, pricing requests,
            proposals, activities, contracts, and reporting.
          </Typography.Paragraph>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button size="large" type="primary">
                Open workspace
              </Button>
            </Link>
            <Link href="/register">
              <Button size="large">Create workspace</Button>
            </Link>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {heroCards.map((card) => (
            <Col key={card.title} span={24} md={8}>
              <Card className="h-full border-0 shadow-lg shadow-slate-200/70">
                <Typography.Title level={4}>{card.title}</Typography.Title>
                <Typography.Paragraph className="!mb-0 !text-slate-500">
                  {card.copy}
                </Typography.Paragraph>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </main>
  );
}
