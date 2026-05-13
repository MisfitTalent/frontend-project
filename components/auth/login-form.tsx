"use client";

import { Alert, Button, Card, Form, Input, Typography } from "antd";

import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { useStyles } from "./login-form.styles";

type LoginValues = {
  email: string;
  password: string;
};

export const LoginForm = () => {
  const { styles } = useStyles();
  const { login } = useAuthActions();
  const { isError, isPending } = useAuthState();
  const [form] = Form.useForm<LoginValues>();

  const onFinish = async (values: LoginValues) => {
    await login(values);
  };

  return (
    <Card className={styles.card}>
      <div className={styles.intro}>
        <Typography.Title level={2} className={styles.title}>
          Welcome back
        </Typography.Title>
        <Typography.Paragraph className={styles.mutedText}>
          Sign in with your organisation account to manage your sales workspace.
        </Typography.Paragraph>
      </div>

      {isError ? (
        <Alert
          className={styles.alert}
          message="We could not sign you in with those credentials."
          type="error"
        />
      ) : null}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ message: "Email is required", required: true }]}
        >
          <Input placeholder="admin@autosales.com" size="large" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ message: "Password is required", required: true }]}
        >
          <Input.Password placeholder="Enter your password" size="large" />
        </Form.Item>

        <Button block htmlType="submit" loading={isPending} size="large" type="primary">
          Sign in
        </Button>
      </Form>
    </Card>
  );
};
