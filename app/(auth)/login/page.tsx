"use client";
import Link from "next/link";
import { Typography } from "antd";
import { LoginForm } from "@/components/auth/login-form";
import { useStyles } from "./style";
const LoginPage = () => {
    const { styles } = useStyles();
    return (<main className={styles.hero}>
      <div className={styles.content}>
        <section className={styles.heroCopy}>
          <Typography.Title className={styles.title} level={1}>
            Close the visibility gap in enterprise sales.
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            AutoSales unifies opportunities, proposals, pricing requests, activities, and renewals into one operational workflow.
          </Typography.Paragraph>
          <div className={styles.benefits}>
            {[
            "Track long B2B cycles",
            "Coordinate proposals faster",
            "Prevent renewal leakage",
        ].map((item) => (<div key={item} className={styles.benefitCard}>
                <Typography.Text strong>{item}</Typography.Text>
              </div>))}
          </div>
        </section>

        <section className={styles.formWrap}>
          <div className={styles.formInner}>
            <LoginForm />
            <Typography.Paragraph className={styles.footerText}>
              New workspace? <Link href="/register">Create an account</Link>
            </Typography.Paragraph>
          </div>
        </section>
      </div>
    </main>);
};
export default LoginPage;
