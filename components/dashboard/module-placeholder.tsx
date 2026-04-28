"use client";

import { Card, Col, Empty, Row, Tag, Typography } from "antd";

type ModulePlaceholderProps = {
  description: string;
  title: string;
};

export function ModulePlaceholder({
  description,
  title,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Tag color="blue">AutoSales Module</Tag>
        <Typography.Title className="!mb-0" level={2}>
          {title}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 max-w-3xl !text-slate-500">
          {description}
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24} xl={16}>
          <Card>
            <Empty
              description={`${title} is ready for its dedicated workflows, filters, and day-to-day actions.`}
            />
          </Card>
        </Col>
        <Col span={24} xl={8}>
          <Card title="Coming next">
            <Typography.Paragraph className="!mb-0 !text-slate-500">
              This area is set up for a fuller working view with the right tools and records for this part of the sales cycle.
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
