"use client";

import { Form, Input, Modal, InputNumber } from "antd";
import { useEffect } from "react";
import { useMounted } from "@/lib/client/use-mounted";
import { useContractActions, useContractState } from "@/providers/contractProvider";
import { type IRenewal } from "@/providers/salesTypes";

interface RenewalFormProps {
  isOpen: boolean;
  editingId: string | null;
  onClose: () => void;
}

interface RenewalFormValues {
  clientName: string;
  contractId: string;
  renewalDate: string;
  value: number;
}

export function RenewalForm({ isOpen, editingId, onClose }: RenewalFormProps) {
  const [form] = Form.useForm();
  const mounted = useMounted();
  const { renewals } = useContractState();
  const { addRenewal, updateRenewal } = useContractActions();

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (editingId) {
      const renewal = renewals.find((r) => r.id === editingId);
      if (renewal) {
        form.setFieldsValue(renewal);
      }
    } else {
      form.resetFields();
    }
  }, [editingId, form, isOpen, mounted, renewals]);

  const calculateDaysUntil = (renewalDate: string) => {
    const today = new Date();
    const renewal = new Date(renewalDate);
    const diffTime = renewal.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSubmit = async (values: RenewalFormValues) => {
    const data: IRenewal = {
      id: editingId || Date.now().toString(),
      contractId: values.contractId,
      clientName: values.clientName,
      renewalDate: values.renewalDate,
      value: values.value,
      status: calculateDaysUntil(values.renewalDate) <= 30 ? 0 : 1,
     daysUntilRenewal: calculateDaysUntil(values.renewalDate),
    };

    if (editingId) {
      updateRenewal(editingId, data);
    } else {
      addRenewal(data);
    }

    onClose();
    form.resetFields();
  };

  return mounted ? (
    <Modal
      title={editingId ? "Edit Renewal" : "Add Renewal"}
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="pt-4">
        <Form.Item
          label="Contract ID"
          name="contractId"
          rules={[{ required: true, message: "Please enter contract ID" }]}
        >
          <Input placeholder="e.g., C001" />
        </Form.Item>

        <Form.Item
          label="Client Name"
          name="clientName"
          rules={[{ required: true, message: "Please enter client name" }]}
        >
          <Input placeholder="e.g., Acme Corp" />
        </Form.Item>

        <Form.Item
          label="Renewal Date (YYYY-MM-DD)"
          name="renewalDate"
          rules={[{ required: true, message: "Please enter renewal date" }]}
        >
          <Input type="date" />
        </Form.Item>

        <Form.Item
          label="Value (R)"
          name="value"
          rules={[{ required: true, message: "Please enter value" }]}
        >
          <InputNumber min={0} />
        </Form.Item>
      </Form>
    </Modal>
  ) : null;
}
