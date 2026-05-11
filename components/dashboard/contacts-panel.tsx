"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Tag, Typography } from "antd";
import { useMemo, useState } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole, isAdminRole, isManagerRole } from "@/lib/auth/roles";
import { useActivityState } from "@/providers/activityProvider";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useContactActions, useContactState } from "@/providers/contactProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { type IContact, type ITeamMember } from "@/providers/salesTypes";
import { useTeamMembersState } from "@/providers/teamMembersProvider";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { ContactForm } from "./contact-form";

type ContactRow = {
  category: "client" | "internal" | "admin";
  clientLabel: string;
  clientNames: string[];
  email: string;
  id: string;
  isEditable: boolean;
  name: string;
  phoneNumber?: string;
  position: string;
  sourceContact?: IContact;
};

const WORKSPACE_ADMIN_ROW: ContactRow = {
  category: "admin",
  clientLabel: "Workspace-wide",
  clientNames: [],
  email: "admin@autosales.com",
  id: "workspace-admin",
  isEditable: false,
  name: "Workspace administrator",
  phoneNumber: "+27 11 000 0100",
  position: "Administrator",
};

const buildInternalRow = (
  member: ITeamMember,
  clientNames: string[],
): ContactRow => ({
  category: "internal",
  clientLabel: clientNames.length > 0 ? clientNames.join(", ") : "Internal team",
  clientNames,
  email: `${member.name.toLowerCase().replace(/\s+/g, ".")}@autosales.com`,
  id: `internal-${member.id}`,
  isEditable: false,
  name: member.name,
  phoneNumber: undefined,
  position: member.role,
});

export function ContactsPanel() {
  const { user } = useAuthState();
  const role = getPrimaryUserRole(user?.roles);
  const { activities } = useActivityState();
  const { clients } = useClientState();
  const { contacts } = useContactState();
  const { deleteContact, addContact, updateContact } = useContactActions();
  const { opportunities } = useOpportunityState();
  const { teamMembers } = useTeamMembersState();
  const [editingContact, setEditingContact] = useState<IContact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isClientUser = isClientScopedUser(user?.clientIds);
  const canManageContacts = !isClientUser;
  const isPrivileged = isAdminRole(role) || isManagerRole(role);

  const visibleClientIds = useMemo(() => {
    if (isClientUser) {
      return new Set(user?.clientIds ?? []);
    }

    if (isPrivileged) {
      return new Set(clients.map((client) => client.id));
    }

    return new Set(
      opportunities
        .filter((opportunity) => opportunity.ownerId === user?.userId)
        .map((opportunity) => opportunity.clientId),
    );
  }, [clients, isClientUser, isPrivileged, opportunities, user?.clientIds, user?.userId]);

  const visibleClientContacts = useMemo<ContactRow[]>(
    () =>
      contacts
        .filter((contact) => visibleClientIds.has(contact.clientId))
        .map((contact) => ({
          category: "client",
          clientLabel:
            clients.find((client) => client.id === contact.clientId)?.name ?? "Unknown client",
          clientNames: [],
          email: contact.email,
          id: contact.id,
          isEditable: canManageContacts,
          name: `${contact.firstName} ${contact.lastName}`.trim(),
          phoneNumber: contact.phoneNumber,
          position: contact.position,
          sourceContact: contact,
        })),
    [canManageContacts, clients, contacts, visibleClientIds],
  );

  const internalRows = useMemo<ContactRow[]>(() => {
    if (isPrivileged) {
      return teamMembers.map((member) => buildInternalRow(member, []));
    }

    if (isClientUser) {
      const involvedClientIds = new Set(user?.clientIds ?? []);
      const involvedOpportunityIds = new Set(
        opportunities
          .filter((opportunity) => involvedClientIds.has(opportunity.clientId))
          .map((opportunity) => opportunity.id),
      );
      const involvedMemberIds = new Set(
        opportunities
          .filter((opportunity) => involvedClientIds.has(opportunity.clientId) && opportunity.ownerId)
          .map((opportunity) => opportunity.ownerId as string),
      );

      activities.forEach((activity) => {
        if (involvedOpportunityIds.has(activity.relatedToId) && activity.assignedToId) {
          involvedMemberIds.add(activity.assignedToId);
        }
      });

      return teamMembers
        .filter((member) => involvedMemberIds.has(member.id))
        .map((member) =>
          buildInternalRow(
            member,
            clients
              .filter((client) => involvedClientIds.has(client.id))
              .map((client) => client.name),
          ),
        );
    }

    return teamMembers.map((member) => buildInternalRow(member, []));
  }, [activities, clients, isClientUser, isPrivileged, opportunities, teamMembers, user?.clientIds]);

  const rows = useMemo(() => {
    const combined = [...visibleClientContacts, ...internalRows];

    if (!isClientUser) {
      combined.push(WORKSPACE_ADMIN_ROW);
    }

    return combined.sort((left, right) => left.name.localeCompare(right.name));
  }, [internalRows, isClientUser, visibleClientContacts]);

  const columns = [
    {
      key: "name",
      title: "Name",
      render: (_: unknown, record: ContactRow) => (
        <div className="space-y-1">
          <Typography.Text strong>{record.name}</Typography.Text>
          <div>
            <Tag color={record.category === "client" ? "blue" : record.category === "admin" ? "gold" : "purple"}>
              {record.category === "client"
                ? "Client contact"
                : record.category === "admin"
                  ? "Admin"
                  : "Internal team"}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      dataIndex: "position",
      key: "position",
      title: "Role",
    },
    {
      dataIndex: "clientLabel",
      key: "clientLabel",
      title: "Scope",
    },
    {
      dataIndex: "email",
      key: "email",
      title: "Email",
      render: (value: string) => <a href={`mailto:${value}`}>{value}</a>,
    },
    {
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      title: "Phone",
      render: (value?: string) =>
        value ? <a href={`tel:${value}`}>{value}</a> : <Typography.Text type="secondary">Not set</Typography.Text>,
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: unknown, record: ContactRow) =>
        record.isEditable && record.sourceContact ? (
          <div className="space-x-2">
            <Button
              icon={<EditOutlined />}
              onClick={() => setEditingContact(record.sourceContact ?? null)}
              size="small"
              type="text"
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => void deleteContact(record.sourceContact!.id)}
              size="small"
              type="text"
            />
          </div>
        ) : (
          <Typography.Text type="secondary">Read only</Typography.Text>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Typography.Title className="!m-0" level={4}>
          Contacts ({rows.length})
        </Typography.Title>
        {canManageContacts ? (
          <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
            Add Contact
          </Button>
        ) : null}
      </div>

      <AnimatedDashboardTable
        columns={columns}
        dataSource={rows}
        emptyDescription="No contacts available for this workspace view"
        isBusy={isSubmitting}
        rowKey="id"
        scroll={{ x: 960 }}
      />

      {canManageContacts ? (
        <ContactForm
          editingContact={editingContact}
          isOpen={isModalOpen || editingContact !== null}
          isSubmitting={isSubmitting}
          onClose={() => {
            setEditingContact(null);
            setIsModalOpen(false);
          }}
          onSave={async (contact) => {
            setIsSubmitting(true);

            try {
              if (editingContact) {
                await updateContact(editingContact.id, contact);
              } else {
                await addContact({
                  clientId: String(contact.clientId),
                  createdAt: new Date().toISOString(),
                  email: String(contact.email),
                  firstName: String(contact.firstName),
                  id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  isPrimaryContact: Boolean(contact.isPrimaryContact),
                  lastName: String(contact.lastName),
                  phoneNumber: contact.phoneNumber,
                  position: String(contact.position),
                });
              }

              setEditingContact(null);
              setIsModalOpen(false);
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
