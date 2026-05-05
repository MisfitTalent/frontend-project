"use client";

import { Alert, Button, Card, Descriptions, Form, Input, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";

import { getUserRoleLabel, isManagerRole, normalizeUserRole } from "@/lib/auth/roles";
import { useAuthActions } from "@/providers/authProvider";
import { useProfileState } from "@/providers/profileProvider";

type EditableProfileFormValues = {
  firstName: string;
  lastName: string;
  organizationName: string;
};

type EditProfileFormProps = {
  isSaving: boolean;
  onCancel: () => void;
  onSave: (values: EditableProfileFormValues) => Promise<void>;
  profile: ReturnType<typeof useProfileState>;
  role: ReturnType<typeof normalizeUserRole>;
  saveError: string | null;
};

function EditProfileForm({
  isSaving,
  onCancel,
  onSave,
  profile,
  role,
  saveError,
}: EditProfileFormProps) {
  const [form] = Form.useForm<EditableProfileFormValues>();

  useEffect(() => {
    form.setFieldsValue({
      firstName: profile.firstName,
      lastName: profile.lastName,
      organizationName: profile.workspace,
    });
  }, [form, profile.firstName, profile.lastName, profile.workspace]);

  return (
    <Form form={form} layout="vertical" onFinish={(values) => void onSave(values)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Form.Item
          label="First name"
          name="firstName"
          rules={[{ message: "Enter your first name.", required: true }]}
        >
          <Input autoComplete="given-name" />
        </Form.Item>
        <Form.Item
          label="Last name"
          name="lastName"
          rules={[{ message: "Enter your last name.", required: true }]}
        >
          <Input autoComplete="family-name" />
        </Form.Item>
      </div>

      <Form.Item
        label="Organization"
        name="organizationName"
        rules={[{ message: "Enter your organization.", required: true }]}
      >
        <Input autoComplete="organization" />
      </Form.Item>

      <Descriptions bordered className="mb-4" column={1}>
        <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
        <Descriptions.Item label="Role">
          <Tag color={isManagerRole(role) ? "#f97316" : "#4f7cac"}>
            {getUserRoleLabel(role)}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {saveError ? <Alert className="mb-4" title={saveError} type="error" /> : null}

      <Space>
        <Button htmlType="submit" loading={isSaving} type="primary">
          Save changes
        </Button>
        <Button disabled={isSaving} onClick={onCancel}>
          Cancel
        </Button>
      </Space>
    </Form>
  );
}

export function ProfilePanel() {
  const profile = useProfileState();
  const { getMe } = useAuthActions();
  const role = normalizeUserRole(profile.role);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (values: EditableProfileFormValues) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch("/api/Auth/me", {
        body: JSON.stringify(values),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Profile update failed.");
      }

      await getMe();
      window.dispatchEvent(
        new CustomEvent("mock-workspace-updated", {
          detail: [],
        }),
      );
      setIsEditing(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "We could not save your profile right now.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSaveError(null);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography.Title className="!m-0" level={4}>
          Account profile
        </Typography.Title>
        <Typography.Text className="!text-slate-500">
          View and update your account details and workspace access.
        </Typography.Text>
      </div>

      <Card
        extra={
          isEditing ? null : (
            <Button onClick={() => setIsEditing(true)} type="primary">
              Edit profile
            </Button>
          )
        }
      >
        {isEditing ? (
          <EditProfileForm
            isSaving={isSaving}
            onCancel={handleCancel}
            onSave={handleSave}
            profile={profile}
            role={role}
            saveError={saveError}
          />
        ) : (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="First name">{profile.firstName}</Descriptions.Item>
            <Descriptions.Item label="Last name">{profile.lastName}</Descriptions.Item>
            <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag color={isManagerRole(role) ? "#f97316" : "#4f7cac"}>
                {getUserRoleLabel(role)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Organization">{profile.workspace}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}
