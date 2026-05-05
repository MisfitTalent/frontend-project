"use client";

import { FileTextOutlined, FolderOpenOutlined, MessageOutlined, ProfileOutlined } from "@ant-design/icons";
import { Card, Col, Empty, Row, Space, Tag, Typography } from "antd";
import Link from "next/link";
import { useMemo } from "react";

import { useAuthState } from "@/providers/authProvider";
import { ClientMessageCenter } from "@/components/dashboard/client-message-center";
import { useClientState } from "@/providers/clientProvider";
import { useContractState } from "@/providers/contractProvider";
import { useDocumentState } from "@/providers/documentProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteState } from "@/providers/noteProvider";
import { useProposalState } from "@/providers/proposalProvider";

const CLIENT_MESSAGE_CATEGORY = "Client Message";
const LEGACY_CLIENT_MESSAGE_PREFIX = `${CLIENT_MESSAGE_CATEGORY} `;

const isClientMessage = (note: INoteItem) =>
  note.kind === "client_message" ||
  note.category === CLIENT_MESSAGE_CATEGORY ||
  note.category?.startsWith(LEGACY_CLIENT_MESSAGE_PREFIX);

export function ClientDashboardOverview() {
  const { user } = useAuthState();
  const { clients } = useClientState();
  const { contracts } = useContractState();
  const { documents } = useDocumentState();
  const { notes } = useNoteState();
  const { proposals } = useProposalState();

  const primaryClientId = user?.clientIds?.[0];
  const client = clients.find((item) => item.id === primaryClientId) ?? null;

  const clientContracts = useMemo(
    () => contracts.filter((item) => item.clientId === client?.id),
    [client?.id, contracts],
  );
  const clientDocuments = useMemo(
    () => documents.filter((item) => item.clientId === client?.id),
    [client?.id, documents],
  );
  const clientMessages = useMemo(
    () => notes.filter((item) => item.clientId === client?.id && isClientMessage(item)),
    [client?.id, notes],
  );
  const clientProposals = useMemo(
    () => proposals.filter((item) => item.clientId === client?.id),
    [client?.id, proposals],
  );

  const activeContracts = clientContracts.filter((item) => String(item.status) === "Active");
  const latestDocument = [...clientDocuments].sort((left, right) =>
    right.uploadedDate.localeCompare(left.uploadedDate),
  )[0];
  const latestMessage = [...clientMessages].sort((left, right) =>
    right.createdDate.localeCompare(left.createdDate),
  )[0];
  const latestProposal = [...clientProposals].sort((left, right) =>
    right.validUntil.localeCompare(left.validUntil),
  )[0];

  if (!client) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <Empty
          description="No client workspace is linked to this account yet."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Tag color="#4f7cac">Client workspace</Tag>
        <Typography.Title className="!mb-0 !text-slate-900" level={2}>
          {client.name}
        </Typography.Title>
        <Typography.Paragraph className="!mb-0 max-w-3xl !text-slate-500">
          Track proposals, shared documents, messages, and active contracts for your account.
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Link href="/dashboard/proposals">
            <Card className="h-full border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <Space orientation="vertical" size={6}>
                <FileTextOutlined className="text-lg text-[#355c7d]" />
                <Typography.Text className="!text-slate-500">Open proposals</Typography.Text>
                <Typography.Title className="!m-0" level={3}>
                  {clientProposals.length}
                </Typography.Title>
                <Typography.Text className="!text-slate-500">
                  {latestProposal ? `${latestProposal.title} is the latest proposal on record.` : "No proposal shared yet."}
                </Typography.Text>
              </Space>
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Link href="/dashboard/documents">
            <Card className="h-full border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <Space orientation="vertical" size={6}>
                <FolderOpenOutlined className="text-lg text-[#355c7d]" />
                <Typography.Text className="!text-slate-500">Shared documents</Typography.Text>
                <Typography.Title className="!m-0" level={3}>
                  {clientDocuments.length}
                </Typography.Title>
                <Typography.Text className="!text-slate-500">
                  {latestDocument ? `${latestDocument.name} was shared most recently.` : "No files have been shared yet."}
                </Typography.Text>
              </Space>
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Link href="/dashboard/messages">
            <Card className="h-full border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <Space orientation="vertical" size={6}>
                <MessageOutlined className="text-lg text-[#355c7d]" />
                <Typography.Text className="!text-slate-500">Messages</Typography.Text>
                <Typography.Title className="!m-0" level={3}>
                  {clientMessages.length}
                </Typography.Title>
                <Typography.Text className="!text-slate-500">
                  {latestMessage ? `${latestMessage.title} is the latest thread.` : "No account messages yet."}
                </Typography.Text>
              </Space>
            </Card>
          </Link>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Link href="/dashboard/contracts">
            <Card className="h-full border-slate-200 shadow-sm transition-transform hover:-translate-y-0.5">
              <Space orientation="vertical" size={6}>
                <ProfileOutlined className="text-lg text-[#355c7d]" />
                <Typography.Text className="!text-slate-500">Active contracts</Typography.Text>
                <Typography.Title className="!m-0" level={3}>
                  {activeContracts.length}
                </Typography.Title>
                <Typography.Text className="!text-slate-500">
                  {activeContracts.length > 0 ? "Commercial coverage currently on record." : "No active contract has been linked yet."}
                </Typography.Text>
              </Space>
            </Card>
          </Link>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <ClientMessageCenter compact />
        </Col>
        <Col xs={24} xl={10}>
          <Card className="h-full border-slate-200 shadow-sm" title="Account snapshot">
            <div className="space-y-4">
              <div>
                <Typography.Text className="!text-slate-500">Industry</Typography.Text>
                <Typography.Title className="!m-0" level={5}>
                  {client.industry}
                </Typography.Title>
              </div>
              <div>
                <Typography.Text className="!text-slate-500">Segment</Typography.Text>
                <Typography.Title className="!m-0" level={5}>
                  {client.segment ?? "Not set"}
                </Typography.Title>
              </div>
              <div>
                <Typography.Text className="!text-slate-500">Status</Typography.Text>
                <div className="mt-2">
                  <Tag color={client.isActive ? "green" : "red"}>
                    {client.isActive ? "Active" : "Inactive"}
                  </Tag>
                </div>
              </div>
              <div>
                <Typography.Text className="!text-slate-500">Website</Typography.Text>
                <Typography.Paragraph className="!mb-0 !mt-1">
                  {client.website ?? "Not set"}
                </Typography.Paragraph>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
