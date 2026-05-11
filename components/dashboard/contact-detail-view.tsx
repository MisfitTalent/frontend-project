"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Card, Col, Descriptions, Empty, Row, Skeleton, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole, isAdminRole, isManagerRole } from "@/lib/auth/roles";
import { useActivityState } from "@/providers/activityProvider";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useContactState } from "@/providers/contactProvider";
import { useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useTeamMembersState } from "@/providers/teamMembersProvider";
import { buildContactDirectory } from "./contact-directory";

type ContactDetailViewProps = Readonly<{
  contactId: string;
}>;

export function ContactDetailView({ contactId }: ContactDetailViewProps) {
  const { user } = useAuthState();
  const role = getPrimaryUserRole(user?.roles);
  const { activities } = useActivityState();
  const { clients } = useClientState();
  const { contacts } = useContactState();
  const { notes } = useNoteState();
  const { opportunities } = useOpportunityState();
  const { teamMembers } = useTeamMembersState();

  const isClientUser = isClientScopedUser(user?.clientIds);
  const canManageContacts = !isClientUser;
  const isPrivileged = isAdminRole(role) || isManagerRole(role);

  const rows = useMemo(
    () =>
      buildContactDirectory({
        activities,
        canManageContacts,
        clients,
        contacts,
        isClientUser,
        isPrivileged,
        notes,
        opportunities,
        teamMembers,
        userClientIds: user?.clientIds,
        userId: user?.userId,
      }),
    [
      activities,
      canManageContacts,
      clients,
      contacts,
      isClientUser,
      isPrivileged,
      notes,
      opportunities,
      teamMembers,
      user?.clientIds,
      user?.userId,
    ],
  );

  const contact = rows.find((item) => item.id === contactId) ?? null;

  if (!contact && rows.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton.Button active block className="!h-6 !w-44" />
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: "35%" }} />
        </div>
        <Card className="border-slate-200 shadow-sm">
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-6">
        <Link
          className="inline-flex items-center gap-2 font-medium text-[#355c7d] transition-colors hover:text-[#f28c28]"
          href="/dashboard/contacts"
        >
          <ArrowLeftOutlined />
          Back to contacts
        </Link>
        <Card className="border-slate-200 shadow-sm">
          <Empty
            description="This contact record could not be found."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      </div>
    );
  }

  const scopeSummary =
    contact.category === "admin"
      ? "Workspace-wide access point"
      : contact.clientLabel || "Internal team";

  return (
    <div className="space-y-6">
      <Space orientation="vertical" size={8}>
        <Link
          className="inline-flex items-center gap-2 font-medium text-[#355c7d] transition-colors hover:text-[#f28c28]"
          href="/dashboard/contacts"
        >
          <ArrowLeftOutlined />
          Back to contacts
        </Link>
        <div className="space-y-2">
          <Typography.Title className="!mb-0 !text-slate-900" level={2}>
            {contact.name}
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 max-w-3xl !text-slate-500">
            {contact.position} · {scopeSummary}
          </Typography.Paragraph>
        </div>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Contact type</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {contact.category === "client"
                ? "Client"
                : contact.category === "admin"
                  ? "Admin"
                  : "Internal"}
            </Typography.Title>
            <Tag color={contact.category === "client" ? "blue" : contact.category === "admin" ? "gold" : "purple"}>
              {contact.category === "client"
                ? "Client contact"
                : contact.category === "admin"
                  ? "Administrator"
                  : "Internal team"}
            </Tag>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Scope</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {contact.clientNames.length > 1 ? `${contact.clientNames.length} clients` : "Direct"}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">{scopeSummary}</Typography.Text>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card className="h-full border-slate-200 shadow-sm">
            <Typography.Text className="!text-slate-500">Edit access</Typography.Text>
            <Typography.Title className="!mb-1 !mt-2" level={3}>
              {contact.isEditable ? "Managed" : "Read only"}
            </Typography.Title>
            <Typography.Text className="!text-slate-500">
              {contact.isEditable
                ? "This contact can be updated from the contacts workspace."
                : "This contact is system-scoped and cannot be edited here."}
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Card className="border-slate-200 shadow-sm" title="Contact details">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Name">{contact.name}</Descriptions.Item>
          <Descriptions.Item label="Role">{contact.position}</Descriptions.Item>
          <Descriptions.Item label="Email">
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {contact.phoneNumber ? (
              <a href={`tel:${contact.phoneNumber}`}>{contact.phoneNumber}</a>
            ) : (
              "Not set"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Scope">{scopeSummary}</Descriptions.Item>
          <Descriptions.Item label="Category">
            {contact.category === "client"
              ? "Client contact"
              : contact.category === "admin"
                ? "Workspace admin"
                : "Internal team"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
