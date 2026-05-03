"use client";
import { Button, Tag, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useState } from "react";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { useAuthState } from "@/providers/authProvider";
import { useClientActions, useClientState } from "@/providers/clientProvider";
import { useContactState } from "@/providers/contactProvider";
import { useDashboardActions } from "@/providers/dashboardProvider";
import type { IClient } from "@/providers/salesTypes";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { ClientForm } from "./client-form";
import { useStyles } from "./clients-panel.styles";
export const ClientsPanel = () => {
    const { user } = useAuthState();
    const { clients } = useClientState();
    const { contacts } = useContactState();
    const { addClientBundle } = useDashboardActions();
    const { deleteClient, updateClient } = useClientActions();
    const isClientScoped = isClientScopedUser(user?.clientIds);
    const { styles } = useStyles();
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
            render: (_: unknown, record: IClient) => (<Link className={styles.link} href={`/dashboard/clients/${record.id}`}>
          {record.name}
        </Link>),
            title: "Client Name",
        },
        {
            title: "Email",
            key: "email",
            render: (_: unknown, record: IClient) => contacts.find((contact) => contact.clientId === record.id && contact.isPrimaryContact)
                ?.email ?? "No primary contact",
        },
        {
            title: "Phone",
            key: "phone",
            render: (_: unknown, record: IClient) => contacts.find((contact) => contact.clientId === record.id && contact.isPrimaryContact)
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
            render: (_: unknown, record: IClient) => (<Tag color={statusColors[record.isActive ? "Active" : "Inactive"]}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>),
        },
        ...(!isClientScoped
            ? [
                {
                    title: "Actions",
                    key: "actions",
                    render: (_: unknown, record: IClient) => (<div className={styles.actionGroup}>
                <Button type="text" icon={<EditOutlined />} onClick={() => setEditingClient(record)} size="small"/>
                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteClient(record.id)} size="small"/>
              </div>),
                },
            ]
            : []),
    ];
    return (<div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <Typography.Title className={styles.title} level={4}>
            Clients ({clients.length})
          </Typography.Title>
          {isClientScoped ? (<Typography.Text className={styles.mutedText}>
              Read-only client workspace view.
            </Typography.Text>) : null}
        </div>
        {!isClientScoped ? (<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Add Client
          </Button>) : null}
      </div>

      <AnimatedDashboardTable columns={columns} dataSource={clients} emptyDescription="No clients yet" isBusy={isSubmitting} rowKey="id"/>

      {!isClientScoped ? (<ClientForm editingClient={editingClient} isOpen={isModalOpen || editingClient !== null} isSubmitting={isSubmitting} onClose={() => {
                setIsModalOpen(false);
                setEditingClient(null);
            }} onSave={async (values) => {
                setIsSubmitting(true);
                try {
                    if (editingClient) {
                        await updateClient(editingClient.id, {
                            industry: values.industry,
                            name: values.name,
                            segment: values.segment,
                        });
                    }
                    else {
                        await addClientBundle({
                            client: {
                                industry: values.industry,
                                name: values.name,
                                segment: values.segment,
                            },
                            contact: values.contactFirstName && values.contactLastName && values.contactEmail
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
                }
                finally {
                    setIsSubmitting(false);
                }
            }}/>) : null}
    </div>);
};
