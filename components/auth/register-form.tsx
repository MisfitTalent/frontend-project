"use client";

import { Alert, Button, Card, Form, Input, Select, Typography } from "antd";

import { useAuthActions, useAuthState } from "@/providers/authProvider";
import { useStyles } from "./register-form.styles";

type RegistrationScenario = "existing-tenant" | "new-tenant" | "shared-tenant";
type RegistrationRole = "SalesRep" | "SalesManager" | "BusinessDevelopmentManager";

type RegisterValues = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
  role?: RegistrationRole;
  scenario: RegistrationScenario;
  tenantId?: string;
  tenantName?: string;
};

export const RegisterForm = () => {
  const { styles } = useStyles();
  const [form] = Form.useForm<RegisterValues>();
  const { register } = useAuthActions();
  const { isError, isPending } = useAuthState();
  const scenario = Form.useWatch("scenario", form) ?? "new-tenant";

  const onFinish = async (values: RegisterValues) => {
    const { scenario: nextScenario, ...rest } = values;

    if (nextScenario === "new-tenant") {
      await register({
        ...rest,
        role: undefined,
        tenantId: undefined,
        tenantName: values.tenantName,
      });
      return;
    }

    if (nextScenario === "existing-tenant") {
      await register({
        ...rest,
        role: values.role,
        tenantId: values.tenantId,
        tenantName: undefined,
      });
      return;
    }

    await register({
      ...rest,
      role: values.role,
      tenantId: undefined,
      tenantName: undefined,
    });
  };

  return (
    <Card className={styles.card}>
      <div className={styles.intro}>
        <Typography.Title level={2} className={styles.title}>
          Create your workspace
        </Typography.Title>
        <Typography.Paragraph className={styles.mutedText}>
          Create a new organisation, join an existing tenant, or use the shared test workspace.
        </Typography.Paragraph>
      </div>

      {isError ? (
        <Alert
          className={styles.alert}
          message="We could not create your account right now."
          type="error"
        />
      ) : null}

      <Form
        form={form}
        initialValues={{ role: "SalesRep", scenario: "new-tenant" }}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item
          label="Registration flow"
          name="scenario"
          rules={[{ message: "Choose how you want to register", required: true }]}
        >
          <Select
            options={[
              { label: "Create a new organisation", value: "new-tenant" },
              { label: "Join an existing organisation", value: "existing-tenant" },
              { label: "Use the shared test tenant", value: "shared-tenant" },
            ]}
            size="large"
          />
        </Form.Item>

        <div className={styles.fieldsGrid}>
          <Form.Item
            label="First name"
            name="firstName"
            rules={[{ message: "First name is required", required: true }]}
          >
            <Input placeholder="Ava" size="large" />
          </Form.Item>

          <Form.Item
            label="Last name"
            name="lastName"
            rules={[{ message: "Last name is required", required: true }]}
          >
            <Input placeholder="Mokoena" size="large" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ message: "Email is required", required: true }]}
          >
            <Input placeholder="ava@salesautomation.com" size="large" />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phoneNumber"
          >
            <Input placeholder="+27 71 000 0000" size="large" />
          </Form.Item>

          {scenario === "new-tenant" ? (
            <Form.Item
              label="Organisation name"
              name="tenantName"
              rules={[{ message: "Organisation name is required", required: true }]}
            >
              <Input placeholder="Acme Corp" size="large" />
            </Form.Item>
          ) : null}

          {scenario === "existing-tenant" ? (
            <Form.Item
              label="Tenant ID"
              name="tenantId"
              rules={[{ message: "Tenant ID is required", required: true }]}
            >
              <Input
                placeholder="11111111-1111-1111-1111-111111111111"
                size="large"
              />
            </Form.Item>
          ) : null}

          {scenario !== "new-tenant" ? (
            <Form.Item
              label="Role"
              name="role"
              rules={[{ message: "Role is required", required: true }]}
            >
              <Select
                options={[
                  { label: "Sales Rep", value: "SalesRep" },
                  { label: "Sales Manager", value: "SalesManager" },
                  {
                    label: "Business Development Manager",
                    value: "BusinessDevelopmentManager",
                  },
                ]}
                placeholder="Choose a role"
                size="large"
              />
            </Form.Item>
          ) : null}
        </div>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ message: "Password is required", required: true }]}
        >
          <Input.Password placeholder="Create a secure password" size="large" />
        </Form.Item>

        <Button block htmlType="submit" loading={isPending} size="large" type="primary">
          Create account
        </Button>
      </Form>
    </Card>
  );
};
