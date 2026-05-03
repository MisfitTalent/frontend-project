"use client";
import { Card, Col, Empty, Row, Tag, Typography } from "antd";
import { useStyles } from "./module-placeholder.styles";
type ModulePlaceholderProps = {
    description: string;
    title: string;
};
export const ModulePlaceholder = ({ description, title, }: ModulePlaceholderProps) => {
    const { styles } = useStyles();
    return (<div className={styles.container}>
      <div className={styles.header}>
        <Tag color="blue">AutoSales Module</Tag>
        <Typography.Title className={styles.title} level={2}>
          {title}
        </Typography.Title>
        <Typography.Paragraph className={styles.description}>
          {description}
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={24} xl={16}>
          <Card>
            <Empty description={`${title} is ready for its dedicated workflows, filters, and day-to-day actions.`}/>
          </Card>
        </Col>
        <Col span={24} xl={8}>
          <Card title="Coming next">
            <Typography.Paragraph className={styles.mutedText}>
              This area is set up for a fuller working view with the right tools and records for this part of the sales cycle.
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>
    </div>);
};
