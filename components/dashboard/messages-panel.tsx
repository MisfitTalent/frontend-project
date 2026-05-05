"use client";

import { MailOutlined, SendOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AnimatedDashboardTable } from "@/components/dashboard/animated-dashboard-table";
import { ClientMessageCenter } from "@/components/dashboard/client-message-center";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import {
  CLIENT_MESSAGE_CATEGORY,
  getScopedMessageThreads,
  prioritizeMessageThread,
} from "@/lib/dashboard/message-threads";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteActions, useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useStyles } from "./messages-panel.styles";

type MessageFormValues = {
  clientId: string;
  content: string;
  representativeId: string;
  subject: string;
};

const createMessageId = () =>
  `workspace-message-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const clientFacingRole = (role: string) =>
  [
    "Account Executive",
    "Sales Consultant",
    "Client Success",
    "Business Development",
    "Pipeline Director",
    "Proposal Manager",
    "Deal Desk Specialist",
  ].some((token) => role.includes(token));

type MessagePanelContentProps = Readonly<{
  initialClientId: string;
  initialRepresentativeId: string;
  initialSource: string;
  selectedThreadId?: string | null;
}>;

function MessagesPanelContent({
  initialClientId,
  initialRepresentativeId,
  initialSource,
  selectedThreadId,
}: MessagePanelContentProps) {
  const { user } = useAuthState();
  const { clients } = useClientState();
  const { teamMembers } = useDashboardState();
  const { notes } = useNoteState();
  const { addNote, updateNote } = useNoteActions();
  const { opportunities } = useOpportunityState();
  const { styles } = useStyles();
  const role = getPrimaryUserRole(user?.roles);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId);
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState<string>(
    initialRepresentativeId,
  );
  const [selectedSource, setSelectedSource] = useState<string>(initialSource);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<INoteItem | null>(null);
  const [form] = Form.useForm<MessageFormValues>();

  const isScopedClientUser = isClientScopedUser(user?.clientIds);

  const messageThreads = useMemo(
    () =>
      getScopedMessageThreads({
        clientIds: user?.clientIds,
        notes,
        opportunities,
        role,
        userId: user?.userId,
      }),
    [notes, opportunities, role, user?.clientIds, user?.userId],
  );

  const representativeOptions = useMemo(
    () =>
      teamMembers
        .filter((member) => clientFacingRole(member.role))
        .map((member) => ({
          label: member.name,
          value: member.id,
        }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    [teamMembers],
  );

  const scopedClientIds = useMemo(
    () =>
      [...new Set(messageThreads.map((thread) => thread.clientId).filter(Boolean))] as string[],
    [messageThreads],
  );
  const scopedRepresentativeIds = useMemo(
    () =>
      [
        ...new Set(
          messageThreads.map((thread) => thread.representativeId).filter(Boolean),
        ),
      ] as string[],
    [messageThreads],
  );
  const resolvedSelectedClientId =
    selectedClientId !== "all" && !scopedClientIds.includes(selectedClientId)
      ? "all"
      : selectedClientId;
  const resolvedSelectedRepresentativeId =
    selectedRepresentativeId !== "all" &&
    !scopedRepresentativeIds.includes(selectedRepresentativeId)
      ? "all"
      : selectedRepresentativeId;
  const resolvedSelectedSource = ["assistant", "client_portal", "workspace"].includes(
    selectedSource,
  )
    ? selectedSource
    : "all";

  const visibleThreads = useMemo(
    () => {
      const filteredThreads = messageThreads.filter((note) => {
        if (
          resolvedSelectedClientId !== "all" &&
          note.clientId !== resolvedSelectedClientId
        ) {
          return false;
        }

        if (
          resolvedSelectedRepresentativeId !== "all" &&
          note.representativeId !== resolvedSelectedRepresentativeId
        ) {
          return false;
        }

        if (resolvedSelectedSource !== "all" && note.source !== resolvedSelectedSource) {
          return false;
        }

        return true;
      });

      return prioritizeMessageThread(filteredThreads, selectedThreadId);
    },
    [
      messageThreads,
      resolvedSelectedClientId,
      resolvedSelectedRepresentativeId,
      resolvedSelectedSource,
      selectedThreadId,
    ],
  );

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        label: client.name,
        value: client.id,
      })),
    [clients],
  );
  const visibleClientOptions = useMemo(
    () =>
      clientOptions.filter((option) => scopedClientIds.includes(option.value)),
    [clientOptions, scopedClientIds],
  );
  const visibleRepresentativeOptions = useMemo(
    () =>
      representativeOptions.filter((option) =>
        scopedRepresentativeIds.includes(option.value),
      ),
    [representativeOptions, scopedRepresentativeIds],
  );

  const unacknowledgedCount = messageThreads.filter(
    (note) => note.source === "client_portal" && note.status !== "Acknowledged",
  ).length;
  const outboundCount = messageThreads.filter((note) => note.source === "workspace").length;
  const uniqueClientCount = new Set(
    messageThreads.map((note) => note.clientId).filter(Boolean),
  ).size;
  const activeRepCount = new Set(
    messageThreads.map((note) => note.representativeId).filter(Boolean),
  ).size;

  const openComposer = (note?: INoteItem) => {
    const accountLeadId =
      note?.clientId &&
      opportunities.find(
        (opportunity) => opportunity.clientId === note.clientId && opportunity.ownerId,
      )?.ownerId;

    form.setFieldsValue({
      clientId: note?.clientId ?? clients[0]?.id ?? "",
      content: note ? `Hi, regarding "${note.title}"...` : "",
      representativeId:
        note?.representativeId ??
        accountLeadId ??
        representativeOptions.find((option) => option.value === user?.userId)?.value ??
        representativeOptions[0]?.value ??
        "",
      subject: note ? `Re: ${note.title}` : "Client follow-up",
    });
    setActiveThread(note ?? null);
    setIsModalOpen(true);
  };

  const closeComposer = () => {
    setIsModalOpen(false);
    setActiveThread(null);
    form.resetFields();
  };

  const handleSubmit = (values: MessageFormValues) => {
    const representative = teamMembers.find((member) => member.id === values.representativeId);

    if (!representative) {
      messageApi.error("Choose a representative before sending the reply.");
      return;
    }

    addNote({
      category: CLIENT_MESSAGE_CATEGORY,
      clientId: values.clientId,
      content: values.content.trim(),
      createdDate: new Date().toISOString().split("T")[0],
      id: createMessageId(),
      kind: "client_message",
      representativeId: representative.id,
      representativeName: representative.name,
      source: "workspace",
      status: "Acknowledged",
      submittedBy: user?.email ?? undefined,
      title: values.subject.trim(),
    });

    if (activeThread && activeThread.status !== "Acknowledged") {
      updateNote(activeThread.id, {
        status: "Acknowledged",
      });
    }

    messageApi.success("Message recorded in the workspace.");
    closeComposer();
  };

  const columns: ColumnsType<INoteItem> = [
    {
      key: "client",
      render: (_value, record) =>
        clients.find((client) => client.id === record.clientId)?.name ?? "Unlinked client",
      title: "Client",
    },
    {
      dataIndex: "title",
      key: "title",
      title: "Subject",
    },
    {
      key: "representative",
      render: (_value, record) =>
        record.representativeName ??
        teamMembers.find((member) => member.id === record.representativeId)?.name ??
        "Unassigned",
      title: "Representative",
    },
    {
      key: "source",
      render: (_value, record) => (
        <Tag color={record.source === "workspace" ? "gold" : "blue"}>
          {record.source === "workspace" ? "Workspace" : "Client"}
        </Tag>
      ),
      title: "Source",
    },
    {
      key: "status",
      render: (_value, record) => (
        <Tag color={record.status === "Acknowledged" ? "green" : "blue"}>
          {record.status ?? "Sent"}
        </Tag>
      ),
      title: "Status",
    },
    {
      dataIndex: "createdDate",
      key: "createdDate",
      title: "Date",
    },
    {
      key: "actions",
      render: (_value, record) => (
        <Button icon={<SendOutlined />} onClick={() => openComposer(record)}>
          Reply
        </Button>
      ),
      title: "Actions",
    },
  ];

  if (isScopedClientUser) {
    return <ClientMessageCenter />;
  }

  return (
    <div className={styles.container}>
      {contextHolder}

      <div className={styles.cardGridFour}>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Client threads</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {uniqueClientCount}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Accounts with at least one message thread.
          </Typography.Text>
        </Card>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Waiting on response</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {unacknowledgedCount}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Incoming client messages not yet acknowledged.
          </Typography.Text>
        </Card>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Outbound replies</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {outboundCount}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Workspace-originated messages recorded in notes.
          </Typography.Text>
        </Card>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Active representatives</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {activeRepCount}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Team members currently linked to client threads.
          </Typography.Text>
        </Card>
      </div>

      <Card
        className={styles.card}
        extra={
          <Button icon={<MailOutlined />} onClick={() => openComposer()} type="primary">
            Reply from workspace
          </Button>
        }
        title="Client conversations"
      >
        <div className={styles.filterBar}>
          <Space size="middle" wrap>
            <Select
              className={styles.filterSelect}
              onChange={setSelectedClientId}
              options={[{ label: "All clients", value: "all" }, ...visibleClientOptions]}
              value={resolvedSelectedClientId}
            />
            <Select
              className={styles.filterSelect}
              onChange={setSelectedRepresentativeId}
              options={[
                { label: "All representatives", value: "all" },
                ...visibleRepresentativeOptions,
              ]}
              value={resolvedSelectedRepresentativeId}
            />
            <Select
              className={styles.filterSelect}
              onChange={setSelectedSource}
              options={[
                { label: "All sources", value: "all" },
                { label: "Client", value: "client_portal" },
                { label: "Workspace", value: "workspace" },
                { label: "Assistant", value: "assistant" },
              ]}
              value={resolvedSelectedSource}
            />
          </Space>
          <Link href="/dashboard/clients" className="text-[#355c7d] hover:text-[#f28c28]">
            View client records
          </Link>
        </div>

        <div className={styles.tableWrap}>
          <AnimatedDashboardTable
            columns={columns}
            dataSource={visibleThreads}
            emptyDescription="No client messages match the current filters."
            rowKey="id"
            scroll={{ x: 980 }}
          />
        </div>
      </Card>

      <Card className={styles.card} title="Latest threads">
        {visibleThreads.length > 0 ? (
          <div className={styles.messageList}>
            {visibleThreads.slice(0, 6).map((note) => (
              <div className={styles.messageCard} key={note.id}>
                <div className={styles.messageHeader}>
                  <div className="space-y-2">
                    <Typography.Title className="!m-0" level={5}>
                      {note.title}
                    </Typography.Title>
                    <Space size="small" wrap>
                      <Tag color="geekblue">
                        {clients.find((client) => client.id === note.clientId)?.name ??
                          "Unlinked client"}
                      </Tag>
                      <Tag color={note.source === "workspace" ? "gold" : "blue"}>
                        {note.source === "workspace" ? "Workspace" : "Client"}
                      </Tag>
                      <Tag color={note.status === "Acknowledged" ? "green" : "blue"}>
                        {note.status ?? "Sent"}
                      </Tag>
                    </Space>
                  </div>
                  <Button icon={<SendOutlined />} onClick={() => openComposer(note)}>
                    Reply
                  </Button>
                </div>
                <Typography.Paragraph className={styles.messageText}>
                  {note.content}
                </Typography.Paragraph>
                <Typography.Text className={styles.messageFooter}>
                  {note.representativeName ?? "Unassigned"} · {note.createdDate}
                </Typography.Text>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            description="No client messages are available right now."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      <Modal
        forceRender
        onCancel={closeComposer}
        onOk={() => form.submit()}
        okText="Send reply"
        open={isModalOpen}
        title="Reply from workspace"
      >
        <Form className={styles.modalForm} form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Client"
            name="clientId"
            rules={[{ message: "Choose a client", required: true }]}
          >
            <Select options={clientOptions} placeholder="Select client" />
          </Form.Item>
          <Form.Item
            label="Representative"
            name="representativeId"
            rules={[{ message: "Choose a representative", required: true }]}
          >
            <Select options={representativeOptions} placeholder="Select representative" />
          </Form.Item>
          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ message: "Add a subject", required: true }]}
          >
            <Input placeholder="Message subject" />
          </Form.Item>
          <Form.Item
            label="Message"
            name="content"
            rules={[{ message: "Enter the message", required: true }]}
          >
            <Input.TextArea placeholder="Write the reply" rows={5} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export function MessagesPanel() {
  const searchParams = useSearchParams();
  const selectedThreadId = searchParams.get("threadId");
  const initialClientId = searchParams.get("clientId") ?? "all";
  const initialRepresentativeId = searchParams.get("representativeId") ?? "all";
  const initialSource = searchParams.get("source") ?? "all";
  const panelKey = searchParams.toString();

  return (
    <MessagesPanelContent
      initialClientId={initialClientId}
      initialRepresentativeId={initialRepresentativeId}
      initialSource={initialSource}
      key={panelKey}
      selectedThreadId={selectedThreadId}
    />
  );
}
