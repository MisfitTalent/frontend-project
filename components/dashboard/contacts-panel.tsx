"use client";

import { Button, Space, Tag, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { useState } from "react";

import { useContactActions, useContactState } from "@/providers/contactProvider";
import type { IContact } from "@/providers/salesTypes";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { ContactForm } from "./contact-form";

export function ContactsPanel() {
  const { contacts } = useContactState();
  const { addContact, deleteContact, updateContact } = useContactActions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<IContact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_: unknown, record: IContact) => `${record.firstName} ${record.lastName}`.trim(),
    },
    { title: "Email", dataIndex: "email", key: "email", render: (email: string) => <a href={`mailto:${email}`}><MailOutlined /> {email}</a> },
    { title: "Phone", dataIndex: "phoneNumber", key: "phoneNumber", render: (phone: string) => phone ? <a href={`tel:${phone}`}><PhoneOutlined /> {phone}</a> : "Not set" },
    { title: "Role", dataIndex: "position", key: "position", render: (role: string) => <Tag>{role}</Tag> },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: IContact) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => setEditingContact(record)} size="small" />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteContact(record.id)} size="small" />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Typography.Title level={4} className="!m-0">Contacts ({contacts.length})</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>Add Contact</Button>
      </div>
      <AnimatedDashboardTable
        columns={columns}
        dataSource={contacts}
        emptyDescription="No contacts yet"
        isBusy={isSubmitting}
        rowKey="id"
      />
      <ContactForm
        editingContact={editingContact}
        isOpen={isModalOpen || editingContact !== null}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContact(null);
        }}
        onSave={async (contact) => {
          setIsSubmitting(true);

          try {
            if (editingContact) {
              await updateContact(editingContact.id, contact);
            } else {
              await addContact({
                clientId: contact.clientId ?? "",
                createdAt: new Date().toISOString(),
                email: contact.email ?? "",
                firstName: contact.firstName ?? "",
                id: crypto.randomUUID(),
                isPrimaryContact: Boolean(contact.isPrimaryContact),
                lastName: contact.lastName ?? "",
                phoneNumber: contact.phoneNumber,
                position: contact.position ?? "",
              });
            }

            setIsModalOpen(false);
            setEditingContact(null);
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    </div>
  );
}
