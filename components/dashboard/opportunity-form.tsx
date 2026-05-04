"use client";

import { DatePicker, Form, Input, InputNumber, Modal, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/client/session-drafts";
import { OPPORTUNITY_STAGE_ORDER, type IOpportunity } from "@/providers/salesTypes";
import { useClientState } from "@/providers/clientProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import { useOpportunityActions, useOpportunityState } from "@/providers/opportunityProvider";
import { getOpportunityFormDraftKey } from "./draft-storage";

type OpportunityFormValues = {
  clientId: string;
  expectedCloseDate: dayjs.Dayjs;
  ownerId?: string;
  probability: number;
  stage: string;
  title: string;
  value: number;
};

type PersistedOpportunityFormValues = Omit<Partial<OpportunityFormValues>, "expectedCloseDate"> & {
  expectedCloseDate?: string;
};

interface OpportunityFormProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  editingId: string | null;
  onClose: () => void;
  onSubmitStart?: () => void;
  onSubmitEnd?: () => void;
}

export function OpportunityForm({
  isOpen,
  isSubmitting = false,
  editingId,
  onClose,
  onSubmitStart,
  onSubmitEnd,
}: OpportunityFormProps) {
  const [isClient, setIsClient] = useState(false);
  const [form] = Form.useForm<OpportunityFormValues>();
  const { clients } = useClientState();
  const { teamMembers } = useDashboardState();
  const { opportunities } = useOpportunityState();
  const { addOpportunity, updateOpportunity } = useOpportunityActions();
  const draftKey = getOpportunityFormDraftKey(editingId);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const savedDraft = readSessionDraft<PersistedOpportunityFormValues>(draftKey);

    if (editingId) {
      const opportunity = opportunities.find((item) => item.id === editingId);
      if (opportunity) {
        form.setFieldsValue({
          ...opportunity,
          expectedCloseDate: dayjs(opportunity.expectedCloseDate),
          value: opportunity.value ?? opportunity.estimatedValue,
        });
      }
    } else {
      form.resetFields();
    }

    if (savedDraft) {
      form.setFieldsValue({
        ...savedDraft,
        expectedCloseDate: savedDraft.expectedCloseDate
          ? dayjs(savedDraft.expectedCloseDate)
          : undefined,
      });
    }
  }, [draftKey, editingId, form, isOpen, opportunities]);

  const handleSubmit = async (values: OpportunityFormValues) => {
    onSubmitStart?.();

    const data: IOpportunity = {
      clientId: values.clientId,
      createdDate:
        editingId
          ? opportunities.find((item) => item.id === editingId)?.createdDate ??
            new Date().toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      currency: "ZAR",
      estimatedValue: values.value,
      expectedCloseDate: values.expectedCloseDate.format("YYYY-MM-DD"),
      id: editingId || Date.now().toString(),
      name: values.title,
      ownerId: values.ownerId,
      probability: values.probability,
      source: 1,
      stage: values.stage,
      title: values.title,
      value: values.value,
    };

    try {
      if (editingId) {
        await updateOpportunity(editingId, data);
      } else {
        await addOpportunity(data);
      }

      clearSessionDraft(draftKey);
      onClose();
      form.resetFields();
    } finally {
      onSubmitEnd?.();
    }
  };

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
      title={editingId ? "Edit opportunity" : "Add opportunity"}
    >
      <Form
        className="pt-4"
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={(_, allValues: Partial<OpportunityFormValues>) =>
          writeSessionDraft(draftKey, {
            ...allValues,
            expectedCloseDate: allValues.expectedCloseDate
              ? allValues.expectedCloseDate.format("YYYY-MM-DD")
              : undefined,
          } satisfies PersistedOpportunityFormValues)
        }
      >
        <Form.Item
          label="Opportunity name"
          name="title"
          rules={[{ message: "Please enter opportunity name", required: true }]}
        >
          <Input placeholder="e.g., Enterprise software rollout" />
        </Form.Item>

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
            placeholder="Select client"
          />
        </Form.Item>

        <Form.Item
          label="Value (R)"
          name="value"
          rules={[{ message: "Please enter value", required: true }]}
        >
          <InputNumber className="!w-full" min={0} prefix="R" />
        </Form.Item>

        <Form.Item
          label="Pipeline stage"
          name="stage"
          rules={[{ message: "Please select stage", required: true }]}
        >
          <Select
            options={OPPORTUNITY_STAGE_ORDER.map((stage) => ({
              label: stage,
              value: stage,
            }))}
          />
        </Form.Item>

        <Form.Item label="Owner" name="ownerId">
          <Select
            options={teamMembers.map((member) => ({
              label: `${member.name} (${member.availabilityPercent}% free)`,
              value: member.id,
            }))}
            placeholder="Select owner"
          />
        </Form.Item>

        <Form.Item
          label="Confidence (%)"
          name="probability"
          rules={[{ message: "Please enter probability", required: true }]}
        >
          <InputNumber className="!w-full" max={100} min={0} />
        </Form.Item>

        <Form.Item
          label="Expected close date"
          name="expectedCloseDate"
          rules={[{ message: "Please select close date", required: true }]}
        >
          <DatePicker className="!w-full" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
