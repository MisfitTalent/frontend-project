"use client";

import { Form, Input, Modal, Select } from "antd";
import { useEffect } from "react";

import { ActivityStatus, ActivityType, type IActivity } from "@/providers/salesTypes";
import { useActivityActions, useActivityState } from "@/providers/activityProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useProposalState } from "@/providers/proposalProvider";
import { useTeamMembersState } from "@/providers/teamMembersProvider";

interface ActivityFormProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  editingId: string | null;
  onClose: () => void;
  onSubmitStart?: () => void;
  onSubmitEnd?: () => void;
}

export default function ActivityForm({
  isOpen,
  isSubmitting = false,
  editingId,
  onClose,
  onSubmitStart,
  onSubmitEnd,
}: ActivityFormProps) {
  const [form] = Form.useForm();
  const { activities } = useActivityState();
  const { opportunities } = useOpportunityState();
  const { proposals } = useProposalState();
  const { teamMembers } = useTeamMembersState();
  const { addActivity, updateActivity } = useActivityActions();

  useEffect(() => {
    if (editingId) {
      const activity = activities.find((item) => item.id === editingId);
      if (activity) {
        form.setFieldsValue({
          ...activity,
          relatedTo: activity.relatedToId,
        });
      }
    } else {
      form.resetFields();
    }
  }, [activities, editingId, form, isOpen]);

  const handleSubmit = async (values: {
    assignedToId?: string;
    description?: string;
    dueDate: string;
    relatedTo?: string;
    title: string;
    type: ActivityType;
  }) => {
    onSubmitStart?.();

    try {
      const owner = teamMembers.find((member) => member.id === values.assignedToId);
      const data: IActivity = {
        assignedToId: values.assignedToId,
        assignedToName: owner?.name,
        completed: false,
        description: values.description ?? "",
        dueDate: values.dueDate,
        id: editingId || Date.now().toString(),
        priority: 2,
        relatedToId: values.relatedTo || "",
        relatedToType: 2,
        status: ActivityStatus.Scheduled,
        subject: values.title,
        title: values.title,
        type: values.type,
      };

      if (editingId) {
        await updateActivity(editingId, data);
      } else {
        await addActivity(data);
      }

      onClose();
      form.resetFields();
    } finally {
      onSubmitEnd?.();
    }
  };

  return (
    <Modal
      forceRender
      onCancel={onClose}
      onOk={() => form.submit()}
      okButtonProps={{ loading: isSubmitting }}
      open={isOpen}
      title={editingId ? "Edit follow-up" : "Add follow-up"}
    >
      <Form className="pt-4" form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Type"
          name="type"
          rules={[{ message: "Please select type", required: true }]}
        >
          <Select
            options={[
              { label: "Call", value: ActivityType.Call },
              { label: "Email", value: ActivityType.Email },
              { label: "Meeting", value: ActivityType.Meeting },
              { label: "Task", value: ActivityType.Task },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Title"
          name="title"
          rules={[{ message: "Please enter title", required: true }]}
        >
          <Input placeholder="e.g., Follow-up call with client" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea placeholder="Additional details" rows={3} />
        </Form.Item>

        <Form.Item
          label="Due date"
          name="dueDate"
          rules={[{ message: "Please enter due date", required: true }]}
        >
          <Input type="date" />
        </Form.Item>

        <Form.Item label="Owner" name="assignedToId">
          <Select
            options={teamMembers.map((member) => ({
              label: `${member.name} (${member.availabilityPercent}% free)`,
              value: member.id,
            }))}
            placeholder="Select an owner"
          />
        </Form.Item>

        <Form.Item label="Related deal" name="relatedTo">
          <Select
            options={[
              ...opportunities.map((opportunity) => ({
                label: `Opportunity: ${opportunity.name || opportunity.title}`,
                value: opportunity.id,
              })),
              ...proposals.map((proposal) => ({
                label: `Proposal: ${proposal.title}`,
                value: proposal.id,
              })),
            ]}
            placeholder="Select opportunity or proposal"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
