"use client";

import { Button, Tag, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useState } from "react";

import { useClientActions, useClientState } from "@/providers/clientProvider";
import { useContactState } from "@/providers/contactProvider";
import { useDashboardActions } from "@/providers/dashboardProvider";
import type { IClient } from "@/providers/salesTypes";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { ClientForm } from "./client-form";

export function ClientsPanel() {
  const { clients } = useClientState();
  const { contacts } = useContactState();
  const { addClientBundle } = useDashboardActions();
  const { deleteClient, updateClient } = useClientActions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusColors: Record<string, string> = {
    Active: "green",
    Inactive: "red",
  };

  const columns = [
    {
      key: "name",
      render: (_: unknown, record: IClient) => (
        <Link
          className="font-medium text-[#1f365c] transition-colors hover:text-[#f28c28]"
          href={`/dashboard/clients/${record.id}`}
        >
          {record.name}
        </Link>
      ),
      title: "Client Name",
    },
    {
      title: "Email",
      key: "email",
      render: (_: unknown, record: IClient) =>
        contacts.find((contact) => contact.clientId === record.id && contact.isPrimaryContact)
          ?.email ?? "No primary contact",
    },
    {
      title: "Phone",
      key: "phone",
      render: (_: unknown, record: IClient) =>
        contacts.find((contact) => contact.clientId === record.id && contact.isPrimaryContact)
          ?.phoneNumber ?? "Not set",
    },
    {
      title: "Industry",
      dataIndex: "industry",
      key: "industry",
    },
    {
      title: "Status",
      key: "status",
      render: (_: unknown, record: IClient) => (
        <Tag color={statusColors[record.isActive ? "Active" : "Inactive"]}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: IClient) => (
        <div className="space-x-2">
          <Button type="text" icon={<EditOutlined />} onClick={() => setEditingClient(record)} size="small" />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteClient(record.id)} size="small" />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Typography.Title level={4} className="!m-0">
          Clients ({clients.length})
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add Client
        </Button>
      </div>

      <AnimatedDashboardTable
        columns={columns}
        dataSource={clients}
        emptyDescription="No clients yet"
        isBusy={isSubmitting}
        rowKey="id"
      />

      <ClientForm
        editingClient={editingClient}
        isOpen={isModalOpen || editingClient !== null}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        onSave={async (values) => {
          setIsSubmitting(true);

          try {
            if (editingClient) {
              await updateClient(editingClient.id, {
                industry: values.industry,
                name: values.name,
                segment: values.segment,
              });
            } else {
              await addClientBundle({
                client: {
                  industry: values.industry,
                  name: values.name,
                  segment: values.segment,
                },
                contact:
                  values.contactFirstName && values.contactLastName && values.contactEmail
                    ? {
                        email: values.contactEmail,
                        firstName: values.contactFirstName,
                        lastName: values.contactLastName,
                        phoneNumber: values.contactPhoneNumber,
                        position: values.contactPosition,
                      }
                    : undefined,
                opportunity: {
                  description: values.opportunityDescription,
                  expectedCloseDate: values.expectedCloseDate ?? new Date().toISOString().split("T")[0],
                  stage: values.opportunityStage,
                  title: values.opportunityTitle ?? `${values.name} opportunity`,
                  value: values.opportunityValue ?? 0,
                },
              });
            }

            setIsModalOpen(false);
            setEditingClient(null);
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </div>
  );
}
