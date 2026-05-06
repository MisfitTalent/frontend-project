"use client";

import { Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect } from "react";

import { useMounted } from "@/lib/client/use-mounted";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/client/session-drafts";
import { OpportunityStage, type IClient } from "@/providers/salesTypes";
import { getClientFormDraftKey } from "./draft-storage";

type ClientFormValues = {
  expectedCloseDate?: string;
  industry: string;
  name: string;
  opportunityDescription?: string;
  opportunityStage?: OpportunityStage;
  opportunityTitle?: string;
  opportunityValue?: number;
  segment?: string;
};

interface ClientFormProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  editingClient: IClient | null;
  onClose: () => void;
  onSave: (values: ClientFormValues) => Promise<void> | void;
}

export function ClientForm({
  isOpen,
  isSubmitting = false,
  editingClient,
  onClose,
  onSave,
}: ClientFormProps) {
  const [form] = Form.useForm<ClientFormValues>();
  const mounted = useMounted();
  const draftKey = getClientFormDraftKey(editingClient?.id);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const savedDraft = readSessionDraft<Partial<ClientFormValues>>(draftKey);

    if (editingClient) {
      form.setFieldsValue({
        industry: editingClient.industry,
        name: editingClient.name,
        segment: editingClient.segment,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        opportunityStage: OpportunityStage.New,
      });
    }

    if (savedDraft) {
      form.setFieldsValue(savedDraft);
    }
  }, [draftKey, editingClient, form, isOpen, mounted]);

  const handleFinish = async (values: ClientFormValues) => {
    await onSave(values);
    clearSessionDraft(draftKey);
  };

  return mounted ? (
    <Modal
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ loading: isSubmitting }}
      open={isOpen}
      title={editingClient ? "Edit client" : "Add client and opportunity"}
      width={760}
    >
      <Form
        className="pt-4"
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={(_, allValues) =>
          writeSessionDraft(draftKey, allValues satisfies Partial<ClientFormValues>)
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Form.Item
            label="Client name"
            name="name"
            rules={[{ message: "Please enter the client name", required: true }]}
          >
            <Input placeholder="e.g., Northwind Foods" />
          </Form.Item>

          <Form.Item
            label="Industry"
            name="industry"
            rules={[{ message: "Please enter the industry", required: true }]}
          >
            <Input placeholder="e.g., Manufacturing" />
          </Form.Item>

          <Form.Item label="Segment" name="segment">
            <Select
              options={[
                { label: "Enterprise", value: "Enterprise" },
                { label: "Growth", value: "Growth" },
                { label: "SMB", value: "SMB" },
              ]}
              placeholder="Choose segment"
            />
          </Form.Item>
        </div>

        {!editingClient ? (
          <>
            <div className="mt-2 grid gap-5 md:grid-cols-2">
              <Form.Item
                label="Opportunity title"
                name="opportunityTitle"
                rules={[{ message: "Please enter the opportunity title", required: true }]}
              >
                <Input placeholder="e.g., National reporting rollout" />
              </Form.Item>

              <Form.Item
                label="Pipeline stage"
                name="opportunityStage"
                initialValue={OpportunityStage.New}
              >
                <Select
                  options={[
                    { label: "New", value: OpportunityStage.New },
                    { label: "Qualified", value: OpportunityStage.Qualified },
                    { label: "Proposal Sent", value: OpportunityStage.ProposalSent },
                    { label: "Negotiating", value: OpportunityStage.Negotiating },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Opportunity value"
                name="opportunityValue"
                rules={[{ message: "Please enter the opportunity value", required: true }]}
              >
                <InputNumber className="!w-full" min={0} prefix="R" />
              </Form.Item>

              <Form.Item
                label="Expected close date"
                name="expectedCloseDate"
                rules={[{ message: "Please enter the close date", required: true }]}
              >
                <Input type="date" />
              </Form.Item>
            </div>

            <Form.Item label="Opportunity notes" name="opportunityDescription">
              <Input.TextArea
                placeholder="What is being sold and why is it important?"
                rows={4}
              />
            </Form.Item>
          </>
        ) : null}
      </Form>
    </Modal>
  ) : null;
}
