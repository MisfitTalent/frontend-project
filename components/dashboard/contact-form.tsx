"use client";

import { Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";

import { type IContact } from "@/providers/salesTypes";
import { useClientState } from "@/providers/clientProvider";

interface ContactFormProps {
  editingContact: IContact | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (contact: Partial<IContact>) => Promise<void> | void;
}

export function ContactForm({
  editingContact,
  isOpen,
  isSubmitting = false,
  onClose,
  onSave,
}: ContactFormProps) {
  const [isClient, setIsClient] = useState(false);
  const [form] = Form.useForm();
  const { clients } = useClientState();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (editingContact) {
      form.setFieldsValue(editingContact);
    } else {
      form.resetFields();
    }
  }, [editingContact, form, isOpen]);

  if (!isClient) {
    return null;
  }

  return (
    <Modal
      forceRender
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ loading: isSubmitting }}
      open={isOpen}
      title={editingContact ? "Edit contact" : "Add contact"}
    >
      <Form
        className="pt-4"
        form={form}
        layout="vertical"
        onFinish={onSave}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Form.Item
            label="First name"
            name="firstName"
            rules={[{ required: true }]}
          >
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item
            label="Last name"
            name="lastName"
            rules={[{ required: true }]}
          >
            <Input placeholder="Last name" />
          </Form.Item>
        </div>

        <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
          <Input type="email" />
        </Form.Item>

        <Form.Item label="Phone" name="phoneNumber">
          <Input placeholder="+27 ..." />
        </Form.Item>

        <Form.Item label="Role" name="position" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Decision maker", value: "Decision maker" },
              { label: "Technical lead", value: "Technical lead" },
              { label: "Finance reviewer", value: "Finance reviewer" },
            ]}
          />
        </Form.Item>

        <Form.Item label="Client" name="clientId" rules={[{ required: true }]}>
          <Select
            options={clients.map((client) => ({
              label: client.name,
              value: client.id,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
