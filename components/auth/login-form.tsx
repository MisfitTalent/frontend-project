"use client";

import { Alert, Button, Card, Form, Input, Typography } from "antd";

import { useAuthActions, useAuthState } from "@/providers/authProvider";

type LoginValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const { login } = useAuthActions();
  const { isError, isPending } = useAuthState();

  const onFinish = async (values: LoginValues) => {
    await login(values);
  };

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl shadow-slate-200/80">
      <div className="mb-8 space-y-2">
        <Typography.Title level={2} className="!mb-0">
          Welcome back
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 !text-slate-500">
          Sign in with your organisation account to manage your sales workspace. For local testing, use the shared demo admin account below.
        </Typography.Paragraph>
        <Typography.Text className="block !text-sm !text-slate-500">
          Shared demo admin: <strong>admin@autosales.com</strong> / <strong>Admin123</strong>
        </Typography.Text>
      </div>

      {isError ? (
        <Alert
          className="mb-6"
          message="We could not sign you in with those credentials."
          type="error"
        />
      ) : null}

      <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
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
}
