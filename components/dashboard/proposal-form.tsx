"use client";

import { Alert, Button, Form, Input, InputNumber, Modal, Select, Space, Spin, Tag, Typography } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";

import {
  type BackendProposalDto,
  backendRequest,
  mapBackendProposal,
} from "@/lib/client/backend-api";
import { useMounted } from "@/lib/client/use-mounted";
import { clearSessionDraft, readSessionDraft, writeSessionDraft } from "@/lib/client/session-drafts";
import { PROPOSAL_STATUS_COLORS, ProposalStatus, type ILineItem, type IProposal } from "@/providers/salesTypes";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useProposalActions, useProposalState } from "@/providers/proposalProvider";
import { getProposalFormDraftKey } from "./draft-storage";

interface ProposalFormProps {
  isOpen: boolean;
  editingId: string | null;
  onClose: () => void;
}

type ProposalFormValues = {
  description?: string;
  lineItems: Array<ILineItem>;
  opportunityId: string;
  title: string;
  validUntil: string;
};

const createEmptyLineItem = (): ILineItem => ({
  description: "",
  discount: 0,
  productServiceName: "",
  quantity: 1,
  taxRate: 15,
  unitPrice: 0,
});

const getLineItemTotal = (item?: Partial<ILineItem>) => {
  const quantity = Number(item?.quantity ?? 0);
  const unitPrice = Number(item?.unitPrice ?? 0);
  const discount = Number(item?.discount ?? 0);
  const taxRate = Number(item?.taxRate ?? 0);
  const discountedSubtotal = quantity * unitPrice * (1 - discount / 100);

  return discountedSubtotal * (1 + taxRate / 100);
};

export function ProposalForm({ isOpen, editingId, onClose }: ProposalFormProps) {
  const [form] = Form.useForm<ProposalFormValues>();
  const mounted = useMounted();
  const { proposals } = useProposalState();
  const { opportunities } = useOpportunityState();
  const { addProposal, updateProposal } = useProposalActions();
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const draftKey = getProposalFormDraftKey(editingId);

  const watchedLineItems = Form.useWatch("lineItems", form);
  const watchedTitle = Form.useWatch("title", form);
  const editingProposal = proposals.find((item) => item.id === editingId) ?? null;
  const proposalStatus = editingProposal ? String(editingProposal.status) : ProposalStatus.Draft;
  const isLoadingProposal = Boolean(
    editingId && !editingProposal?.lineItems?.length && !watchedTitle,
  );

  const proposalTotal = useMemo(
    () =>
      (watchedLineItems ?? []).reduce(
        (sum, item) => sum + getLineItemTotal(item),
        0,
      ),
    [watchedLineItems],
  );

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!isOpen) {
      return;
    }

    if (!editingId) {
      const savedDraft = readSessionDraft<Partial<ProposalFormValues>>(draftKey);

      form.resetFields();
      form.setFieldsValue({
        lineItems: savedDraft?.lineItems?.length
          ? savedDraft.lineItems
          : [createEmptyLineItem()],
        ...savedDraft,
      });
      return;
    }

    let isActive = true;

    const loadProposal = async () => {
      const sourceProposal =
        editingProposal?.lineItems && editingProposal.lineItems.length > 0
          ? editingProposal
          : mapBackendProposal(
              await backendRequest<BackendProposalDto>(`/api/Proposals/${editingId}`),
            );

      if (!isActive) {
        return;
      }

      const baseValues: ProposalFormValues = {
        description: sourceProposal.description,
        lineItems:
          sourceProposal.lineItems && sourceProposal.lineItems.length > 0
            ? sourceProposal.lineItems
            : [createEmptyLineItem()],
        opportunityId: sourceProposal.opportunityId,
        title: sourceProposal.title,
        validUntil: sourceProposal.validUntil,
      };
      const savedDraft = readSessionDraft<Partial<ProposalFormValues>>(draftKey);

      form.setFieldsValue(savedDraft ? { ...baseValues, ...savedDraft } : baseValues);
    };

    void loadProposal().catch((error) => {
      console.error(error);

      if (!isActive) {
        return;
      }

      setFormError(error instanceof Error ? error.message : "Could not load proposal details.");
    });

    return () => {
      isActive = false;
    };
  }, [draftKey, editingId, editingProposal, form, isOpen, mounted]);

  const handleSubmit = async (values: ProposalFormValues) => {
    setIsSaving(true);
    setFormError(null);

    try {
      const opportunity = opportunities.find((item) => item.id === values.opportunityId);
      const lineItems = (values.lineItems ?? []).filter(
        (item) => item.productServiceName.trim().length > 0,
      );

      if (lineItems.length === 0) {
        throw new Error("Add at least one line item before saving the proposal.");
      }

      const data: IProposal = {
        clientId: opportunity?.clientId ?? editingProposal?.clientId ?? "",
        currency: editingProposal?.currency ?? "ZAR",
        description: values.description?.trim() || undefined,
        id: editingId || Date.now().toString(),
        lineItems,
        opportunityId: values.opportunityId,
        status: editingProposal?.status ?? ProposalStatus.Draft,
        title: values.title.trim(),
        validUntil: values.validUntil,
        value: proposalTotal,
      };

      if (editingId) {
        await updateProposal(editingId, data);
      } else {
        await addProposal(data);
      }

      clearSessionDraft(draftKey);
      onClose();
      form.resetFields();
    } catch (error) {
      console.error(error);
      setFormError(error instanceof Error ? error.message : "Could not save the proposal.");
    } finally {
      setIsSaving(false);
    }
  };

  return mounted ? (
    <Modal
      onCancel={() => {
        setFormError(null);
        onClose();
      }}
      onOk={() => form.submit()}
      okButtonProps={{ loading: isSaving }}
      open={isOpen}
      title={editingId ? "Edit proposal" : "Create proposal"}
      width={920}
    >
      {isLoadingProposal ? (
        <div className="flex items-center justify-center py-16">
          <Spin />
        </div>
      ) : (
        <Form
          className="pt-4"
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(_, allValues) =>
            writeSessionDraft(draftKey, allValues satisfies Partial<ProposalFormValues>)
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Form.Item
              label="Opportunity"
              name="opportunityId"
              rules={[{ message: "Please select an opportunity", required: true }]}
            >
              <Select
                disabled={Boolean(editingId)}
                options={opportunities.map((opportunity) => ({
                  label: opportunity.name || opportunity.title,
                  value: opportunity.id,
                }))}
                placeholder="Select an opportunity"
              />
            </Form.Item>

            <Form.Item
              label="Valid until"
              name="validUntil"
              rules={[{ message: "Please enter the proposal validity date", required: true }]}
            >
              <Input type="date" />
            </Form.Item>

            <Form.Item
              label="Proposal title"
              name="title"
              rules={[{ message: "Please enter a proposal title", required: true }]}
            >
              <Input placeholder="e.g., Enterprise commercial proposal" />
            </Form.Item>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Typography.Text className="block !text-slate-500">
                Current workflow status
              </Typography.Text>
              <div className="mt-2 flex items-center gap-2">
                <Tag color={PROPOSAL_STATUS_COLORS[proposalStatus] ?? "#94a3b8"}>
                  {proposalStatus}
                </Tag>
                <Typography.Text className="!text-slate-500">
                  Use the workflow actions on the proposal board to submit, approve, or reject.
                </Typography.Text>
              </div>
            </div>
          </div>

          <Form.Item label="Commercial context" name="description">
            <Input.TextArea
              placeholder="Summarize scope, assumptions, and commercial notes."
              rows={4}
            />
          </Form.Item>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <Typography.Title className="!mb-0" level={5}>
                  Line items
                </Typography.Title>
                <Typography.Text className="!text-slate-500">
                  Quantities, discounts, and tax roll into the proposal total automatically.
                </Typography.Text>
              </div>
            </div>

            <Form.List name="lineItems">
              {(fields, { add, remove }) => (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                      key={field.key}
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                        <Form.Item
                          hidden
                          name={[field.name, "id"]}
                        >
                          <Input />
                        </Form.Item>

                        <Form.Item
                          className="xl:col-span-2"
                          label="Product or service"
                          name={[field.name, "productServiceName"]}
                          rules={[{ message: "Please enter a line item name", required: true }]}
                        >
                          <Input placeholder="e.g., Managed analytics" />
                        </Form.Item>

                        <Form.Item
                          label="Qty"
                          name={[field.name, "quantity"]}
                          rules={[{ message: "Quantity is required", required: true }]}
                        >
                          <InputNumber className="!w-full" min={1} />
                        </Form.Item>

                        <Form.Item
                          label="Unit price"
                          name={[field.name, "unitPrice"]}
                          rules={[{ message: "Unit price is required", required: true }]}
                        >
                          <InputNumber className="!w-full" min={0} prefix="R" />
                        </Form.Item>

                        <Form.Item label="Discount %" name={[field.name, "discount"]}>
                          <InputNumber className="!w-full" max={100} min={0} />
                        </Form.Item>

                        <Form.Item label="Tax %" name={[field.name, "taxRate"]}>
                          <InputNumber className="!w-full" max={100} min={0} />
                        </Form.Item>
                      </div>

                      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <Form.Item
                          className="!mb-0"
                          label="Description"
                          name={[field.name, "description"]}
                        >
                          <Input.TextArea
                            placeholder="Optional notes for this line item"
                            rows={2}
                          />
                        </Form.Item>

                        <Space className="justify-between md:justify-end">
                          <Typography.Text className="!text-slate-500">
                            Total: R {getLineItemTotal(watchedLineItems?.[field.name]).toLocaleString()}
                          </Typography.Text>
                          <Button
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            Remove
                          </Button>
                        </Space>
                      </div>
                    </div>
                  ))}

                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => add(createEmptyLineItem())}
                    type="dashed"
                  >
                    Add line item
                  </Button>
                </div>
              )}
            </Form.List>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
            <Typography.Text strong>Proposal total</Typography.Text>
            <Typography.Text className="!text-lg !text-orange-600">
              R {proposalTotal.toLocaleString()}
            </Typography.Text>
          </div>

          {formError ? (
            <Alert className="mt-4" message={formError} type="error" />
          ) : null}
        </Form>
      )}
    </Modal>
  ) : null;
}
