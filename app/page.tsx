"use client";
import Link from "next/link";
import { Button, Card, Col, Row, Tag } from "antd";
import { Typography } from "antd";
import { useStyles } from "./page.style";
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
const Home = () => {
    const { styles } = useStyles();
    return (<main className={styles.hero}>
      <section className={styles.container}>
        <div className={styles.intro}>
          <Tag color="geekblue">AutoSales</Tag>
          <Typography.Title className={styles.title} level={1}>
            A sales automation workspace built for complex enterprise cycles.
          </Typography.Title>
          <Typography.Paragraph className={styles.description}>
            Replace scattered spreadsheets and informal follow-up with one platform for opportunities, pricing requests,
            proposals, activities, contracts, and reporting.
          </Typography.Paragraph>
          <div className={styles.ctaGroup}>
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
          {heroCards.map((card) => (<Col key={card.title} span={24} md={8}>
              <Card className={styles.card}>
                <Typography.Title level={4}>{card.title}</Typography.Title>
                <Typography.Paragraph className={styles.description}>
                  {card.copy}
                </Typography.Paragraph>
              </Card>
            </Col>))}
        </Row>
      </section>
    </main>);
};
export default Home;
