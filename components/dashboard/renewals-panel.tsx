"use client";

import { Button, Empty, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useState } from "react";

import { type IRenewal } from "@/providers/salesTypes";
import { useContractActions, useContractState } from "@/providers/contractProvider";
import { RenewalForm } from "./renewal-form";

export function RenewalsPanel() {
  const { renewals } = useContractState();
  const { deleteRenewal } = useContractActions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const getUrgencyColor = (daysUntilRenewal: number) => {
    if (daysUntilRenewal <= 7) return "#f97316";
    if (daysUntilRenewal <= 21) return "#f59e0b";
    return "#355c7d";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Typography.Title className="!m-0" level={4}>
            Renewals ({renewals.length})
          </Typography.Title>
          <Typography.Text className="!text-slate-500">
            Watch contract risk and upcoming dates before revenue slips.
          </Typography.Text>
        </div>
        <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
          Add renewal
        </Button>
      </div>

      {renewals.length === 0 ? (
        <Empty description="No renewals" />
      ) : (
        <Table
          columns={[
            { dataIndex: "clientName", key: "clientName", title: "Client" },
            {
              dataIndex: "value",
              key: "value",
              render: (value: number) => `R ${value.toLocaleString()}`,
              title: "Value",
            },
            { dataIndex: "renewalDate", key: "renewalDate", title: "Renewal date" },
            {
              dataIndex: "daysUntilRenewal",
              key: "daysUntilRenewal",
              render: (daysUntilRenewal: number) => (
                <Tag color={getUrgencyColor(daysUntilRenewal)}>
                  {daysUntilRenewal} days
                </Tag>
              ),
              title: "Days until",
            },
            {
              key: "actions",
              render: (_: unknown, record: IRenewal) => (
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
                    onClick={() => deleteRenewal(record.id)}
                    size="small"
                    type="text"
                  />
                </div>
              ),
              title: "Actions",
            },
          ]}
          dataSource={renewals}
          pagination={false}
          rowKey="id"
        />
      )}

      <RenewalForm
        editingId={editingId}
        isOpen={isModalOpen || editingId !== null}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
      />
    </div>
  );
}
