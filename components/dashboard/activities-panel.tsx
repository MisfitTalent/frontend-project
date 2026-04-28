"use client";

import { Button, Checkbox, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

import { type IActivity } from "@/providers/salesTypes";
import { useActivityActions, useActivityState } from "@/providers/activityProvider";
import ActivityForm from "./activity-form";
import { AnimatedDashboardTable } from "./animated-dashboard-table";

const typeColors: Record<string, string> = {
  Call: "#355c7d",
  Email: "#4f7cac",
  Meeting: "#f97316",
  Task: "#94a3b8",
};

export function ActivitiesPanel() {
  const { activities } = useActivityState();
  const { deleteActivity, updateActivity } = useActivityActions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns = [
    {
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color={typeColors[type] || "#64748b"}>{type}</Tag>,
      title: "Type",
    },
    {
      dataIndex: "title",
      key: "title",
      title: "Follow-up",
    },
    {
      dataIndex: "dueDate",
      key: "dueDate",
      title: "Due date",
    },
    {
      key: "completed",
      render: (completed: boolean, record: IActivity) => (
        <Checkbox
          checked={completed}
          onChange={(event) =>
            updateActivity(record.id, {
              completed: event.target.checked,
              status: event.target.checked ? "Completed" : "Scheduled",
            })
          }
        />
      ),
      title: "Done",
      dataIndex: "completed",
    },
    {
      key: "actions",
      render: (_: unknown, record: IActivity) => (
        <div className="space-x-2">
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditingId(record.id)}
            size="small"
            type="text"
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteActivity(record.id)}
            size="small"
            type="text"
          />
        </div>
      ),
      title: "Actions",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Typography.Title className="!m-0" level={4}>
            Follow-ups ({activities.length})
          </Typography.Title>
          <Typography.Text className="!text-slate-500">
            Calls, emails, meetings, and tasks tied to live deals.
          </Typography.Text>
        </div>
        <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
          Add follow-up
        </Button>
      </div>

      <AnimatedDashboardTable
        columns={columns}
        dataSource={activities}
        emptyDescription="No follow-ups"
        isBusy={isSubmitting}
        rowKey="id"
      />

      <ActivityForm
        editingId={editingId}
        isOpen={isModalOpen || editingId !== null}
        isSubmitting={isSubmitting}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        onSubmitStart={() => setIsSubmitting(true)}
        onSubmitEnd={() => setIsSubmitting(false)}
      />
    </div>
  );
}
