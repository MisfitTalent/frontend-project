"use client";
import Link from "next/link";
import { Typography } from "antd";
import { RegisterForm } from "@/components/auth/register-form";
import { useStyles } from "./style";
const RegisterPage = () => {
    const { styles } = useStyles();
    return (<main className={styles.hero}>
      <div className={styles.content}>
        <section className={styles.heroCopy}>
          <Typography.Title className={styles.title} level={1}>
            Build a sales workspace around accountability.
          </Typography.Title>
          <Typography.Paragraph className={styles.subtitle}>
            Launch a shared workspace for your team and centralise business development, proposals, pricing, and contract visibility.
          </Typography.Paragraph>
          <div className={styles.benefits}>
            {[
            "Role-aware access for admins, sales managers, and reps",
            "Structured follow-up workflows across the entire pipeline",
            "One shared view of renewals, deadlines, and reporting",
        ].map((item) => (<div key={item} className={styles.benefitCard}>
                <Typography.Text>{item}</Typography.Text>
              </div>))}
          </div>
        </section>

        <section className={styles.formWrap}>
          <div className={styles.formInner}>
            <RegisterForm />
            <Typography.Paragraph className={styles.footerText}>
              Already registered? <Link href="/login">Sign in instead</Link>
            </Typography.Paragraph>
          </div>
        </section>
      </div>
    </main>);
};
export default RegisterPage;
