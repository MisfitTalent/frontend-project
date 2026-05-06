"use client";

import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo, useState } from "react";

import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole, isAdminRole, isManagerRole } from "@/lib/auth/roles";
import { useActivityState } from "@/providers/activityProvider";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useContactActions, useContactState } from "@/providers/contactProvider";
import { useNoteActions, useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { type IContact } from "@/providers/salesTypes";
import { useTeamMembersState } from "@/providers/teamMembersProvider";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { buildContactDirectory, type ContactRow } from "./contact-directory";
import { ContactForm } from "./contact-form";

export function ContactsPanel() {
  const { user } = useAuthState();
  const role = getPrimaryUserRole(user?.roles);
  const { activities } = useActivityState();
  const { clients } = useClientState();
  const { contacts } = useContactState();
  const { deleteContact, addContact, updateContact } = useContactActions();
  const { notes } = useNoteState();
  const { updateNote } = useNoteActions();
  const { opportunities } = useOpportunityState();
  const { teamMembers } = useTeamMembersState();
  const [editingContact, setEditingContact] = useState<IContact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isClientUser = isClientScopedUser(user?.clientIds);
  const canManageContacts = !isClientUser;
  const isPrivileged = isAdminRole(role) || isManagerRole(role);

  const rows = useMemo(() => {
    return buildContactDirectory({
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
    });
  }, [
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
  ]);

  const updateAssignmentStatus = async (
    record: ContactRow,
    status: "Accepted" | "Rejected",
  ) => {
    if (!record.assignmentNoteId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateNote(record.assignmentNoteId, { status });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "name",
      title: "Name",
      render: (_: unknown, record: ContactRow) => (
        <div className="space-y-1">
          <Link
            className="font-medium text-[#1f365c] transition-colors hover:text-[#f28c28]"
            href={`/dashboard/contacts/${record.id}`}
          >
            {record.name}
          </Link>
          <div>
            <Tag color={record.category === "client" ? "blue" : record.category === "admin" ? "gold" : "purple"}>
              {record.category === "client"
                ? "Client contact"
                : record.category === "admin"
                  ? "Admin"
                  : "Internal team"}
            </Tag>
            {record.assignmentStatus ? (
              <Tag color={record.assignmentStatus === "Accepted" ? "green" : "orange"}>
                {record.assignmentStatus}
              </Tag>
            ) : null}
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
        isClientUser &&
        record.assignmentStatus === "Pending client response" &&
        record.assignmentNoteId ? (
          <div className="space-x-2">
            <Button onClick={() => void updateAssignmentStatus(record, "Accepted")} size="small" type="primary">
              Accept
            </Button>
            <Button danger onClick={() => void updateAssignmentStatus(record, "Rejected")} size="small">
              Reject
            </Button>
          </div>
        ) : record.isEditable && record.sourceContact ? (
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
