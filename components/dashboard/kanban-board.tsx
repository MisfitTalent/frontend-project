"use client";

import { Button, Card, Space, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";

interface KanbanItem {
  id: string;
  metadata?: Record<string, string>;
  stage: string;
  title: string;
  value?: number;
}

interface KanbanBoardProps {
  items: KanbanItem[];
  stages: readonly string[] | string[];
  stageColors: Record<string, string>;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onStageChange?: (itemId: string, newStage: string) => void;
  title?: string;
}

export function KanbanBoard({
  items,
  stages,
  stageColors,
  onEdit,
  onDelete,
  onStageChange,
  title = "Kanban Board",
}: KanbanBoardProps) {
  const [draggedItem, setDraggedItem] = useState<KanbanItem | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const groupedItems = useMemo(() => {
    const grouped: Record<string, KanbanItem[]> = {};
    stages.forEach((stage) => {
      grouped[stage] = items.filter((item) => item.stage === stage);
    });
    return grouped;
  }, [items, stages]);

  return (
    <Card
      className="dashboard-table-card dashboard-kanban-card border-slate-200"
      styles={{ body: { padding: 20 } }}
      title={title}
      extra={
        <Typography.Text className="!text-slate-500">
          Drag cards to update the automated pipeline.
        </Typography.Text>
      }
    >
      <div className="dashboard-kanban-scroll">
        {stages.map((stage) => (
          <div
            className="dashboard-kanban-lane"
            key={stage}
            onDragLeave={() => setDragOverStage(null)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOverStage(stage);
            }}
            onDrop={() => {
              if (draggedItem && draggedItem.stage !== stage) {
                onStageChange?.(draggedItem.id, stage);
              }
              setDraggedItem(null);
              setDragOverStage(null);
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stageColors[stage] ?? "#94a3b8" }}
                />
                <Typography.Text strong>{stage}</Typography.Text>
              </div>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {groupedItems[stage]?.length ?? 0}
              </span>
            </div>

            <div
              className={`dashboard-kanban-lane-body transition ${
                dragOverStage === stage
                  ? "dashboard-kanban-lane-body--active"
                  : ""
              }`}
            >
              <div className="space-y-3">
                {(groupedItems[stage] ?? []).map((item) => (
                  <div
                    className="dashboard-kanban-card-item cursor-grab"
                    draggable
                    key={item.id}
                    onDragEnd={() => setDraggedItem(null)}
                    onDragStart={() => setDraggedItem(item)}
                  >
                    <div
                      className="mb-3 h-1.5 rounded-full"
                      style={{ backgroundColor: stageColors[stage] ?? "#94a3b8" }}
                    />
                    <Typography.Title className="!mb-1 !text-sm !leading-5" level={5}>
                      {item.title}
                    </Typography.Title>
                    {item.value ? (
                      <Typography.Text className="!text-sm !font-semibold !text-orange-500">
                        R {item.value.toLocaleString()}
                      </Typography.Text>
                    ) : null}
                    {item.metadata ? (
                      <div className="mt-3 space-y-1.5">
                        {Object.entries(item.metadata).map(([key, value]) => (
                          <div className="flex items-start justify-between gap-3" key={key}>
                            <Typography.Text className="min-w-0 !text-[11px] !font-semibold !uppercase !tracking-[0.08em] !text-slate-400">
                              {key}
                            </Typography.Text>
                            <Typography.Text className="min-w-0 flex-1 break-words text-right !text-xs !text-slate-600">
                              {value}
                            </Typography.Text>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <Space className="!mt-4 w-full justify-between">
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => onEdit(item.id)}
                        size="small"
                        type="text"
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onDelete(item.id)}
                        size="small"
                        type="text"
                      />
                    </Space>
                  </div>
                ))}

                {!groupedItems[stage]?.length ? (
                  <div className="dashboard-kanban-empty-state">
                    <span>Drop cards here</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
