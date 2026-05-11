"use client";

import { Form, Input, Modal, Select } from "antd";
import { useEffect } from "react";

import { useClientState } from "@/providers/clientProvider";
import type { IContact } from "@/providers/salesTypes";

type ContactFormValues = {
  clientId: string;
  email: string;
  firstName: string;
  isPrimaryContact?: boolean;
  lastName: string;
  phoneNumber?: string;
  position: string;
};

type ContactFormProps = Readonly<{
  editingContact: IContact | null;
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (contact: Partial<IContact>) => Promise<void> | void;
}>;

export function ContactForm({
  editingContact,
  isOpen,
  isSubmitting = false,
  onClose,
  onSave,
}: ContactFormProps) {
  const [form] = Form.useForm<ContactFormValues>();
  const { clients } = useClientState();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (editingContact) {
      form.setFieldsValue(editingContact);
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      clientId: clients[0]?.id,
      isPrimaryContact: false,
    });
  }, [clients, editingContact, form, isOpen]);

  const handleFinish = async (values: ContactFormValues) => {
    await onSave({
      clientId: values.clientId,
      email: values.email.trim(),
      firstName: values.firstName.trim(),
      isPrimaryContact: Boolean(values.isPrimaryContact),
      lastName: values.lastName.trim(),
      phoneNumber: values.phoneNumber?.trim() || undefined,
      position: values.position.trim(),
    });
  };

  return (
    <Modal
      forceRender
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ loading: isSubmitting }}
      open={isOpen}
      title={editingContact ? "Edit contact" : "Add contact"}
    >
      <Form className="pt-4" form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Client"
          name="clientId"
          rules={[{ message: "Please choose a client", required: true }]}
        >
          <Select
            options={clients.map((client) => ({
              label: client.name,
              value: client.id,
            }))}
            placeholder="Choose client"
          />
        </Form.Item>

        <div className="grid gap-4 md:grid-cols-2">
          <Form.Item
            label="First name"
            name="firstName"
            rules={[{ message: "Please enter the first name", required: true }]}
          >
            <Input placeholder="First name" />
          </Form.Item>

          <Form.Item
            label="Last name"
            name="lastName"
            rules={[{ message: "Please enter the last name", required: true }]}
          >
            <Input placeholder="Last name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { message: "Please enter the email address", required: true },
              { type: "email" },
            ]}
          >
            <Input placeholder="contact@company.com" />
          </Form.Item>

          <Form.Item label="Phone" name="phoneNumber">
            <Input placeholder="+27 11 000 0000" />
          </Form.Item>

          <Form.Item
            label="Position"
            name="position"
            rules={[{ message: "Please enter the contact role", required: true }]}
          >
            <Input placeholder="e.g. Operations Director" />
          </Form.Item>

          <Form.Item label="Primary contact" name="isPrimaryContact">
            <Select
              options={[
                { label: "No", value: false },
                { label: "Yes", value: true },
              ]}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
