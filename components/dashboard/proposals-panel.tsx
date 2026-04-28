"use client";

import { Button, Input, Modal, Space, Tag, Typography, message } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";

import { OpportunityStage, PROPOSAL_STATUS_COLORS, ProposalStatus, type IProposal } from "@/providers/salesTypes";
import { formatCurrency } from "@/providers/salesSelectors";
import { useClientState } from "@/providers/clientProvider";
import { useOpportunityActions } from "@/providers/opportunityProvider";
import {
  useProposalActions,
  useProposalState,
} from "@/providers/proposalProvider";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { KanbanBoard } from "./kanban-board";
import { ProposalForm } from "./proposal-form";
import { ProposalStatusChart } from "./proposal-status-chart";

const getOpportunityStageForProposal = (status: string) => {
  if (status === ProposalStatus.Submitted) {
    return OpportunityStage.ProposalSent;
  }

  if (status === ProposalStatus.Approved) {
    return OpportunityStage.Won;
  }

  if (status === ProposalStatus.Rejected) {
    return OpportunityStage.Lost;
  }

  return undefined;
};

export function ProposalsPanel() {
  const { clients } = useClientState();
  const { proposals } = useProposalState();
  const { updateOpportunity } = useOpportunityActions();
  const { deleteProposal, transitionProposal } = useProposalActions();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rejectingProposalId, setRejectingProposalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const proposalById = useMemo(
    () => new Map(proposals.map((proposal) => [proposal.id, proposal])),
    [proposals],
  );

  const syncOpportunityStage = async (proposal: IProposal, status: string) => {
    const nextStage = getOpportunityStageForProposal(status);

    if (nextStage) {
      await updateOpportunity(proposal.opportunityId, { stage: nextStage });
    }
  };

  const handleTransition = async (
    proposalId: string,
    status: ProposalStatus | string,
    decisionNote?: string,
  ) => {
    const proposal = proposalById.get(proposalId);

    if (!proposal) {
      return;
    }

    try {
      const nextProposal = await transitionProposal(proposalId, status, decisionNote);

      if (nextProposal) {
        await syncOpportunityStage(nextProposal, String(nextProposal.status));
      }

      messageApi.success(`Proposal moved to ${status}.`);
    } catch (error) {
      console.error(error);
      messageApi.error(
        error instanceof Error ? error.message : "Could not update the proposal workflow.",
      );
    }
  };

  const handleDelete = async (proposalId: string) => {
    try {
      await deleteProposal(proposalId);
      messageApi.success("Proposal deleted.");
    } catch (error) {
      console.error(error);
      messageApi.error(
        error instanceof Error ? error.message : "Could not delete the proposal.",
      );
    }
  };

  const handleStageChange = (proposalId: string, newStatus: string) => {
    if (newStatus === ProposalStatus.Draft) {
      messageApi.info("Draft is the starting state. Use Edit if you need to update the proposal content.");
      return;
    }

    if (newStatus === ProposalStatus.Rejected) {
      setRejectingProposalId(proposalId);
      return;
    }

    void handleTransition(proposalId, newStatus);
  };

  const columns = [
    {
      dataIndex: "title",
      key: "title",
      title: "Proposal",
    },
    {
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={PROPOSAL_STATUS_COLORS[status] ?? "#94a3b8"}>{status}</Tag>
      ),
      title: "Status",
    },
    {
      dataIndex: "value",
      key: "value",
      render: (value: number) => formatCurrency(value),
      title: "Value",
    },
    {
      key: "items",
      render: (_: unknown, record: IProposal) =>
        record.lineItemsCount ?? record.lineItems?.length ?? 0,
      title: "Items",
    },
    {
      dataIndex: "validUntil",
      key: "validUntil",
      title: "Valid until",
    },
    {
      key: "workflow",
      render: (_: unknown, record: IProposal) => {
        const status = String(record.status);

        return (
          <Space wrap>
            {status === ProposalStatus.Draft ? (
              <Button onClick={() => void handleTransition(record.id, ProposalStatus.Submitted)}>
                Submit
              </Button>
            ) : null}
            {status === ProposalStatus.Submitted ? (
              <>
                <Button
                  onClick={() => void handleTransition(record.id, ProposalStatus.Approved)}
                  type="primary"
                >
                  Approve
                </Button>
                <Button danger onClick={() => setRejectingProposalId(record.id)}>
                  Reject
                </Button>
              </>
            ) : null}
          </Space>
        );
      },
      title: "Workflow",
    },
    {
      key: "actions",
      render: (_: unknown, record: IProposal) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditingId(record.id)}
            size="small"
            type="text"
          />
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
  ];

  return (
    <div className="space-y-6">
      {contextHolder}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Typography.Title className="!m-0" level={4}>
            Proposals ({proposals.length})
          </Typography.Title>
          <Typography.Text className="!text-slate-500">
            Build structured commercials, then move them through draft, submission, approval, and rejection.
          </Typography.Text>
        </div>
        <Button icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} type="primary">
          Create proposal
        </Button>
      </div>

      <ProposalStatusChart
        proposals={proposals.map((proposal) => ({
          id: proposal.id,
          status: String(proposal.status),
          value: proposal.value || 0,
        }))}
        statusColors={PROPOSAL_STATUS_COLORS}
      />

      <KanbanBoard
        items={proposals.map((proposal) => ({
          id: proposal.id,
          metadata: {
            client:
              clients.find((client) => client.id === proposal.clientId)?.name ?? "Client pending",
            items: String(proposal.lineItemsCount ?? proposal.lineItems?.length ?? 0),
          },
          stage: String(proposal.status),
          title: proposal.title,
          value: proposal.value || 0,
        }))}
        onDelete={(id) => void handleDelete(id)}
        onEdit={(id) => setEditingId(id)}
        onStageChange={handleStageChange}
        stageColors={PROPOSAL_STATUS_COLORS}
        stages={[
          ProposalStatus.Draft,
          ProposalStatus.Submitted,
          ProposalStatus.Approved,
          ProposalStatus.Rejected,
        ]}
        title="Proposal workflow"
      />

      <AnimatedDashboardTable
        columns={columns}
        dataSource={proposals}
        emptyDescription="No proposals yet"
        rowKey="id"
      />

      <ProposalForm
        editingId={editingId}
        isOpen={isModalOpen || editingId !== null}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
      />

      <Modal
        onCancel={() => {
          setRejectReason("");
          setRejectingProposalId(null);
        }}
        onOk={() => {
          if (!rejectingProposalId) {
            return;
          }

          void handleTransition(rejectingProposalId, ProposalStatus.Rejected, rejectReason).finally(
            () => {
              setRejectReason("");
              setRejectingProposalId(null);
            },
          );
        }}
        okButtonProps={{ danger: true }}
        okText="Reject proposal"
        open={Boolean(rejectingProposalId)}
        title="Reject proposal"
      >
        <div className="space-y-3 pt-2">
          <Typography.Text className="!text-slate-500">
            Capture a reason so the rejection is visible in the proposal history.
          </Typography.Text>
          <Input.TextArea
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Why was this proposal rejected?"
            rows={4}
            value={rejectReason}
          />
        </div>
      </Modal>
    </div>
  );
}
