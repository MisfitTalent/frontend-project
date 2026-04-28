"use client";

import { Card, Descriptions, Tag, Typography } from "antd";

import { getUserRoleLabel, isManagerRole, normalizeUserRole } from "@/lib/auth/roles";
import { useProfileState } from "@/providers/profileProvider";

export function ProfilePanel() {
  const profile = useProfileState();
  const role = normalizeUserRole(profile.role);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Typography.Title className="!m-0" level={4}>
          Account profile
        </Typography.Title>
        <Typography.Text className="!text-slate-500">
          View your account details and workspace access.
        </Typography.Text>
      </div>

      <Card>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="First name">
            {profile.firstName}
          </Descriptions.Item>
          <Descriptions.Item label="Last name">
            {profile.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
          <Descriptions.Item label="Role">
            <Tag color={isManagerRole(role) ? "#f97316" : "#4f7cac"}>
              {getUserRoleLabel(role)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Organization">
            {profile.workspace}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
