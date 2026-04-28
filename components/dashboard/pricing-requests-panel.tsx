"use client";

import { Alert, Button, Form, Input, Modal, Select, Space, Tag, Typography, message } from "antd";
import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import {
  PRICING_REQUEST_STATUS_COLORS,
  type IPricingRequest,
} from "@/providers/salesTypes";
import { useDashboardState } from "@/providers/dashboardProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import {
  usePricingRequestActions,
  usePricingRequestState,
} from "@/providers/pricingRequestProvider";
import { AnimatedDashboardTable } from "./animated-dashboard-table";

type PricingRequestFormValues = {
  assignedToId?: string;
  description?: string;
  opportunityId: string;
  priority: number;
  requiredByDate?: string;
  title: string;
};

const PRIORITY_OPTIONS = [
  { label: "Critical", value: 1 },
  { label: "High", value: 2 },
  { label: "Medium", value: 3 },
  { label: "Low", value: 4 },
];

const formatDate = (value?: string) => value || "Not set";

export function PricingRequestsPanel() {
  const { pricingRequests } = usePricingRequestState();
  const { teamMembers } = useDashboardState();
  const { opportunities } = useOpportunityState();
  const {
    addPricingRequest,
    completePricingRequest,
    deletePricingRequest,
    updatePricingRequest,
  } = usePricingRequestActions();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm<PricingRequestFormValues>();

  useEffect(() => {
    if (!editingId) {
      form.resetFields();
      return;
    }

    const request = pricingRequests.find((item) => item.id === editingId);

    if (request) {
      form.setFieldsValue({
        assignedToId: request.assignedToId,
        description: request.description,
        opportunityId: request.opportunityId,
        priority: request.priority,
        requiredByDate: request.requiredByDate,
        title: request.title,
      });
    }
  }, [editingId, form, pricingRequests]);

  const handleSave = async (values: PricingRequestFormValues) => {
    setFormError(null);
    setIsSaving(true);

    try {
      const existingRequest = pricingRequests.find((item) => item.id === editingId);
      const opportunity = opportunities.find((item) => item.id === values.opportunityId);
      const request: IPricingRequest = {
        assignedToId: values.assignedToId,
        assignedToName: teamMembers.find((member) => member.id === values.assignedToId)?.name,
        createdAt: existingRequest?.createdAt ?? new Date().toISOString(),
        description: values.description?.trim() || undefined,
        id: editingId ?? Date.now().toString(),
        opportunityId: values.opportunityId,
        opportunityTitle: opportunity?.name || opportunity?.title,
        priority: values.priority,
        requiredByDate: values.requiredByDate,
        status: existingRequest?.status ?? "Pending",
        title: values.title.trim(),
      };

      if (editingId) {
        await updatePricingRequest(editingId, request);
        messageApi.success("Pricing request updated.");
      } else {
        await addPricingRequest(request);
        messageApi.success("Pricing request created.");
      }

      setIsModalOpen(false);
      setEditingId(null);
      form.resetFields();
    } catch (error) {
      console.error(error);
      setFormError(
        error instanceof Error ? error.message : "Could not save the pricing request.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePricingRequest(id);
      messageApi.success("Pricing request deleted.");
    } catch (error) {
      console.error(error);
      messageApi.error(
        error instanceof Error ? error.message : "Could not delete the pricing request.",
      );
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completePricingRequest(id);
      messageApi.success("Pricing request marked complete.");
    } catch (error) {
      console.error(error);
      messageApi.error(
        error instanceof Error ? error.message : "Could not complete the pricing request.",
      );
    }
  };

  return (
    <div className="space-y-4">
      {contextHolder}

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Typography.Title className="!m-0" level={4}>
            Pricing requests ({pricingRequests.length})
          </Typography.Title>
          <Typography.Text className="!text-slate-500">
            Track deal-desk coordination, assignees, deadlines, and completion before proposals go out.
          </Typography.Text>
        </div>
        <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
          New request
        </Button>
      </div>

      <AnimatedDashboardTable
        columns={[
          { dataIndex: "title", key: "title", title: "Request" },
          {
            key: "opportunity",
            render: (_: unknown, record: IPricingRequest) =>
              record.opportunityTitle ??
              opportunities.find((opportunity) => opportunity.id === record.opportunityId)?.title ??
              "Opportunity pending",
            title: "Opportunity",
          },
          {
            key: "owner",
            render: (_: unknown, record: IPricingRequest) =>
              record.assignedToName ?? "Unassigned",
            title: "Assigned to",
          },
          {
            key: "priority",
            render: (_: unknown, record: IPricingRequest) =>
              record.priorityLabel ??
              PRIORITY_OPTIONS.find((option) => option.value === record.priority)?.label ??
              "Priority",
            title: "Priority",
          },
          {
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
              <Tag color={PRICING_REQUEST_STATUS_COLORS[status] ?? "#94a3b8"}>{status}</Tag>
            ),
            title: "Status",
          },
          {
            key: "requiredByDate",
            render: (_: unknown, record: IPricingRequest) => formatDate(record.requiredByDate),
            title: "Required by",
          },
          {
            key: "createdAt",
            render: (_: unknown, record: IPricingRequest) =>
              formatDate(record.createdAt.split("T")[0]),
            title: "Created",
          },
          {
            key: "actions",
            render: (_: unknown, record: IPricingRequest) => (
              <Space wrap>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingId(record.id);
                    setIsModalOpen(true);
                  }}
                  size="small"
                  type="text"
                />
                {record.status !== "Completed" ? (
                  <Button
                    icon={<CheckOutlined />}
                    onClick={() => void handleComplete(record.id)}
                    size="small"
                  >
                    Complete
                  </Button>
                ) : null}
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => void handleDelete(record.id)}
                  size="small"
                  type="text"
                />
              </Space>
            ),
            title: "Actions",
          },
        ]}
        dataSource={pricingRequests}
        emptyDescription="No pricing requests"
        isBusy={isSaving}
        rowKey="id"
      />

      <Modal
        onCancel={() => {
          setFormError(null);
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onOk={() => form.submit()}
        okButtonProps={{ loading: isSaving }}
        open={isModalOpen}
        title={editingId ? "Edit pricing request" : "New pricing request"}
      >
        <Form className="pt-4" form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            label="Opportunity"
            name="opportunityId"
            rules={[{ message: "Please select an opportunity", required: true }]}
          >
            <Select
              options={opportunities.map((opportunity) => ({
                label: opportunity.name || opportunity.title,
                value: opportunity.id,
              }))}
              placeholder="Select the related opportunity"
            />
          </Form.Item>

          <Form.Item
            label="Request title"
            name="title"
            rules={[{ message: "Please enter a title", required: true }]}
          >
            <Input placeholder="e.g., Discount approval for enterprise scope" />
          </Form.Item>

          <Form.Item label="Commercial context" name="description">
            <Input.TextArea
              placeholder="What pricing review or exception is needed?"
              rows={4}
            />
          </Form.Item>

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item
              label="Priority"
              name="priority"
              rules={[{ message: "Please select a priority", required: true }]}
            >
              <Select options={PRIORITY_OPTIONS} />
            </Form.Item>

            <Form.Item label="Required by" name="requiredByDate">
              <Input type="date" />
            </Form.Item>

            <Form.Item label="Assign to" name="assignedToId">
              <Select
                allowClear
                options={teamMembers.map((member) => ({
                  label: member.name,
                  value: member.id,
                }))}
                placeholder="Choose a deal-desk owner"
              />
            </Form.Item>
          </div>

          {formError ? <Alert message={formError} type="error" /> : null}
        </Form>
      </Modal>
    </div>
  );
}
