"use client";

import { MailOutlined, SendOutlined, TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import {
  Alert,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { AnimatedDashboardTable } from "@/components/dashboard/animated-dashboard-table";
import { ClientMessageCenter } from "@/components/dashboard/client-message-center";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import {
  CLIENT_MESSAGE_CATEGORY,
  getScopedMessageThreads,
  isClientRequestThread,
  prioritizeMessageThread,
} from "@/lib/dashboard/message-threads";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteActions, useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useTeamMembersState } from "@/providers/teamMembersProvider";
import { useStyles } from "./messages-panel.styles";

type MessageFormValues = {
  clientId: string;
  content: string;
  representativeId: string;
  subject: string;
};

type AssignmentFormValues = {
  assignmentMessage: string;
  representativeIds: string[];
};

const createMessageId = () =>
  `workspace-message-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const createAssignmentId = () =>
  `team-assignment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

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
  const router = useRouter();
  const { user } = useAuthState();
  const { clients } = useClientState();
  const { teamMembers } = useTeamMembersState();
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
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeThread, setActiveThread] = useState<INoteItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyForm] = Form.useForm<MessageFormValues>();
  const [assignmentForm] = Form.useForm<AssignmentFormValues>();

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

  const visibleThreads = useMemo(() => {
    const filteredThreads = messageThreads.filter((note) => {
      if (resolvedSelectedClientId !== "all" && note.clientId !== resolvedSelectedClientId) {
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
  }, [
    messageThreads,
    resolvedSelectedClientId,
    resolvedSelectedRepresentativeId,
    resolvedSelectedSource,
    selectedThreadId,
  ]);

  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        label: client.name,
        value: client.id,
      })),
    [clients],
  );
  const visibleClientOptions = useMemo(
    () => clientOptions.filter((option) => scopedClientIds.includes(option.value)),
    [clientOptions, scopedClientIds],
  );
  const visibleRepresentativeOptions = useMemo(
    () =>
      representativeOptions.filter((option) =>
        scopedRepresentativeIds.includes(option.value),
      ),
    [representativeOptions, scopedRepresentativeIds],
  );

  const pendingAdminReviewCount = messageThreads.filter(
    (note) => isClientRequestThread(note) && note.status === "Pending admin review",
  ).length;
  const pendingAdminRequests = useMemo(
    () =>
      messageThreads.filter(
        (note) => isClientRequestThread(note) && note.status === "Pending admin review",
      ),
    [messageThreads],
  );
  const pendingClientResponseCount = messageThreads.filter(
    (note) => note.requestType === "team_assignment" && note.status === "Pending client response",
  ).length;
  const outboundCount = messageThreads.filter((note) => note.source === "workspace").length;
  const uniqueClientCount = new Set(
    messageThreads.map((note) => note.clientId).filter(Boolean),
  ).size;
  const selectedConversationRoot = useMemo(
    () => visibleThreads.find((note) => note.id === selectedThreadId) ?? null,
    [selectedThreadId, visibleThreads],
  );
  const selectedConversationMessages = useMemo(() => {
    if (!selectedConversationRoot?.clientId) {
      return [];
    }

    const linkedRootId = selectedConversationRoot.linkedRequestId ?? selectedConversationRoot.id;

    return messageThreads
      .filter((note) => {
        if (note.clientId !== selectedConversationRoot.clientId) {
          return false;
        }

        return (
          note.id === selectedConversationRoot.id ||
          note.id === linkedRootId ||
          note.linkedRequestId === selectedConversationRoot.id ||
          note.linkedRequestId === linkedRootId
        );
      })
      .sort((left, right) => left.createdDate.localeCompare(right.createdDate));
  }, [messageThreads, selectedConversationRoot]);

  const openConversation = (note: INoteItem) => {
    const params = new URLSearchParams();
    params.set("source", note.source ?? "client_portal");
    params.set("threadId", note.id);

    if (note.clientId) {
      params.set("clientId", note.clientId);
    }

    router.push(`/dashboard/messages?${params.toString()}`);
  };

  const openReplyComposer = (note?: INoteItem) => {
    const accountLeadId =
      note?.clientId &&
      opportunities.find(
        (opportunity) => opportunity.clientId === note.clientId && opportunity.ownerId,
      )?.ownerId;

    replyForm.setFieldsValue({
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
    setIsReplyModalOpen(true);
  };

  const closeReplyComposer = () => {
    setIsReplyModalOpen(false);
    setActiveThread(null);
    replyForm.resetFields();
  };

  const handleReplySubmit = async (values: MessageFormValues) => {
    const representative = teamMembers.find((member) => member.id === values.representativeId);

    if (!representative) {
      messageApi.error("Choose a representative before sending the reply.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addNote({
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
        await updateNote(activeThread.id, {
          status: "Acknowledged",
        });
      }

      messageApi.success("Message recorded in the workspace.");
      closeReplyComposer();
    } catch (error) {
      console.error(error);
      messageApi.error("Could not save the workspace reply.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignModal = useCallback((note: INoteItem) => {
    assignmentForm.setFieldsValue({
      assignmentMessage: `We are assigning the right sales reps to support "${note.title}".`,
      representativeIds: [],
    });
    setActiveThread(note);
    setIsAssignModalOpen(true);
  }, [assignmentForm]);

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setActiveThread(null);
    assignmentForm.resetFields();
    if (selectedThreadId) {
      const params = new URLSearchParams();

      if (resolvedSelectedClientId !== "all") {
        params.set("clientId", resolvedSelectedClientId);
      }
      if (resolvedSelectedRepresentativeId !== "all") {
        params.set("representativeId", resolvedSelectedRepresentativeId);
      }
      if (resolvedSelectedSource !== "all") {
        params.set("source", resolvedSelectedSource);
      }

      router.replace(
        params.toString() ? `/dashboard/messages?${params.toString()}` : "/dashboard/messages",
      );
    }
  };

  const handleAssignSubmit = async (values: AssignmentFormValues) => {
    if (!activeThread?.clientId) {
      messageApi.error("Choose a client request before assigning a representative.");
      return;
    }

    const selectedRepresentatives = teamMembers.filter((member) =>
      values.representativeIds.includes(member.id),
    );

    if (selectedRepresentatives.length === 0) {
      messageApi.error("Select at least one representative.");
      return;
    }

    setIsSubmitting(true);

    try {
      for (const representative of selectedRepresentatives) {
        await addNote({
          assignedByUserId: user?.userId ?? undefined,
          assignedByUserName:
            `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || user?.email || undefined,
          category: CLIENT_MESSAGE_CATEGORY,
          clientId: activeThread.clientId,
          content: values.assignmentMessage.trim(),
          createdDate: new Date().toISOString().split("T")[0],
          id: createAssignmentId(),
          kind: "team_assignment",
          linkedRequestId: activeThread.id,
          representativeId: representative.id,
          representativeName: representative.name,
          requestType: "team_assignment",
          source: "workspace",
          status: "Pending client response",
          submittedBy: user?.email ?? undefined,
          title: `Assigned ${representative.name} to ${activeThread.title}`,
        });
      }

      await updateNote(activeThread.id, {
        status: "Acknowledged",
      });

      messageApi.success("Assignment shared with the client for review.");
      closeAssignModal();
    } catch (error) {
      console.error(error);
      messageApi.error("Could not save the assignment.");
    } finally {
      setIsSubmitting(false);
    }
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
        <Tag
          color={
            record.status === "Accepted"
              ? "green"
              : record.status === "Rejected"
                ? "red"
                : record.status === "Pending admin review"
                  ? "orange"
                  : record.status === "Pending client response"
                    ? "gold"
                    : record.status === "Acknowledged"
                      ? "green"
                      : "blue"
          }
        >
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
      render: (_value, record) =>
        isClientRequestThread(record) && record.status === "Pending admin review" ? (
          <Button icon={<TeamOutlined />} onClick={() => openAssignModal(record)} type="primary">
            Assign reps
          </Button>
        ) : (
          <Button icon={<SendOutlined />} onClick={() => openReplyComposer(record)}>
            Reply
          </Button>
        ),
      title: "Actions",
    },
  ];

  useEffect(() => {
    if (!selectedThreadId || isScopedClientUser || isAssignModalOpen) {
      return;
    }

    const selectedRequest = visibleThreads.find(
      (note) =>
        note.id === selectedThreadId &&
        isClientRequestThread(note) &&
        note.status === "Pending admin review",
    );

    if (selectedRequest) {
      const timer = window.setTimeout(() => {
        openAssignModal(selectedRequest);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [isAssignModalOpen, isScopedClientUser, openAssignModal, selectedThreadId, visibleThreads]);

  if (isScopedClientUser) {
    return <ClientMessageCenter />;
  }

  return (
    <div className={styles.container}>
      {contextHolder}

      {!isScopedClientUser && pendingAdminRequests.length > 0 ? (
        <Alert
          action={
            <Space size="small" wrap>
              <Link
                href={`/dashboard/messages?source=client_portal&threadId=${pendingAdminRequests[0]?.id ?? ""}`}
              >
                <Button className="dashboard-admin-alert__button" icon={<TeamOutlined />} type="primary">
                  Open request
                </Button>
              </Link>
              <Link href="/dashboard/assistant">
                <Button icon={<MailOutlined />}>Handle with AI</Button>
              </Link>
            </Space>
          }
          banner
          className="dashboard-request-queue-banner"
          description={
            <div className="space-y-2">
              <Typography.Text className="!text-slate-700">
                {pendingAdminRequests.length} client request
                {pendingAdminRequests.length === 1 ? "" : "s"} need admin action before the workflow can continue.
              </Typography.Text>
              <div className="space-y-1">
                {pendingAdminRequests.slice(0, 3).map((request) => (
                  <Typography.Text className="block !text-slate-700" key={request.id}>
                    {request.createdDate} - {clients.find((client) => client.id === request.clientId)?.name ?? "Unlinked client"} - {request.title}
                  </Typography.Text>
                ))}
              </div>
            </div>
          }
          message="Client request queue is waiting for admin review"
          showIcon
          type="warning"
        />
      ) : null}

      {!isScopedClientUser && pendingAdminRequests.length > 0 ? (
        <Card className={styles.card} title="Admin review queue">
          <div className={styles.requestQueue}>
            <div className={styles.requestQueueHeader}>
              <Typography.Text className={styles.metricText}>
                These are the actual client requests waiting for admin action.
              </Typography.Text>
              <Link href="/dashboard/assistant">
                <Button icon={<MailOutlined />} type="default">
                  Summarize with AI
                </Button>
              </Link>
            </div>

            {pendingAdminRequests.map((request) => (
              <div className={styles.messageCard} key={request.id}>
                <div className={styles.messageHeader}>
                  <div className="space-y-2">
                    <Typography.Title className="!m-0" level={5}>
                      {request.title}
                    </Typography.Title>
                    <Space size="small" wrap>
                      <Tag color="orange">Needs admin review</Tag>
                      <Tag color="geekblue">
                        {clients.find((client) => client.id === request.clientId)?.name ??
                          "Unlinked client"}
                      </Tag>
                      <Tag color="default">{request.createdDate}</Tag>
                      {request.submittedBy ? (
                        <Tag color="default">{request.submittedBy}</Tag>
                      ) : null}
                    </Space>
                  </div>
                  <Space size="small" wrap>
                    <Button onClick={() => openConversation(request)} type="default">
                      Open chat
                    </Button>
                    <Button
                      icon={<TeamOutlined />}
                      onClick={() => openAssignModal(request)}
                      type="primary"
                    >
                      Assign reps
                    </Button>
                    <Button onClick={() => openReplyComposer(request)}>
                      Reply first
                    </Button>
                  </Space>
                </div>
                <Typography.Paragraph className={styles.messageText}>
                  {request.content}
                </Typography.Paragraph>
                <Typography.Text className={styles.messageFooter}>
                  Client request from{" "}
                  {clients.find((client) => client.id === request.clientId)?.name ??
                    "the client workspace"}
                  .
                </Typography.Text>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {selectedConversationRoot ? (
        <Card className={styles.card} title="Open conversation">
          <div className={styles.conversationThread}>
            <div className={styles.selectedConversationHeader}>
              <div>
                <Typography.Title className="!mb-0" level={4}>
                  {selectedConversationRoot.title}
                </Typography.Title>
                <Typography.Text className={styles.metricText}>
                  {clients.find((client) => client.id === selectedConversationRoot.clientId)?.name ??
                    "Unlinked client"}
                </Typography.Text>
              </div>
              <Space size="small" wrap>
                {isClientRequestThread(selectedConversationRoot) &&
                selectedConversationRoot.status === "Pending admin review" ? (
                  <Button
                    icon={<TeamOutlined />}
                    onClick={() => openAssignModal(selectedConversationRoot)}
                    type="primary"
                  >
                    Assign reps
                  </Button>
                ) : null}
                <Button
                  icon={<SendOutlined />}
                  onClick={() => openReplyComposer(selectedConversationRoot)}
                >
                  Reply
                </Button>
              </Space>
            </div>

            {selectedConversationMessages.map((note) => {
              const isWorkspaceMessage = note.source === "workspace" || note.source === "assistant";

              return (
                <div
                  className={`${styles.conversationBubble} ${
                    isWorkspaceMessage
                      ? styles.conversationBubbleWorkspace
                      : styles.conversationBubbleClient
                  }`}
                  key={note.id}
                >
                  <Typography.Text className={styles.conversationMeta}>
                    {isWorkspaceMessage
                      ? note.source === "assistant"
                        ? "Assistant"
                        : note.representativeName ?? "Workspace"
                      : note.submittedBy ?? "Client"}{" "}
                    · {note.createdDate} · {note.status ?? "Sent"}
                  </Typography.Text>
                  <Typography.Paragraph className={styles.messageText}>
                    {note.content}
                  </Typography.Paragraph>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

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
          <Typography.Text className={styles.metricLabel}>Needs assignment</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {pendingAdminReviewCount}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Client requests waiting for admin assignment.
          </Typography.Text>
        </Card>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Waiting on client</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {pendingClientResponseCount}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Assigned reps still awaiting client acceptance.
          </Typography.Text>
        </Card>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Outbound replies</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {outboundCount}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Workspace-originated updates recorded in notes.
          </Typography.Text>
        </Card>
      </div>

      <Card
        className={styles.card}
        extra={
          <Button icon={<MailOutlined />} onClick={() => openReplyComposer()} type="primary">
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
                      <Tag
                        color={
                          note.status === "Accepted"
                            ? "green"
                            : note.status === "Rejected"
                              ? "red"
                              : note.status === "Pending admin review"
                                ? "orange"
                                : note.status === "Pending client response"
                                  ? "gold"
                                  : note.status === "Acknowledged"
                                    ? "green"
                                    : "blue"
                        }
                      >
                        {note.status ?? "Sent"}
                      </Tag>
                    </Space>
                  </div>
                  {isClientRequestThread(note) && note.status === "Pending admin review" ? (
                    <Space size="small" wrap>
                      <Button onClick={() => openConversation(note)} type="default">
                        Open chat
                      </Button>
                      <Button icon={<TeamOutlined />} onClick={() => openAssignModal(note)} type="primary">
                        Assign reps
                      </Button>
                    </Space>
                  ) : (
                    <Space size="small" wrap>
                      <Button onClick={() => openConversation(note)} type="default">
                        Open chat
                      </Button>
                      <Button icon={<SendOutlined />} onClick={() => openReplyComposer(note)}>
                        Reply
                      </Button>
                    </Space>
                  )}
                </div>
                <Typography.Paragraph className={styles.messageText}>
                  {note.content}
                </Typography.Paragraph>
                <Typography.Text className={styles.messageFooter}>
                  {(note.representativeName ?? "Unassigned") + " · " + note.createdDate}
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
        onCancel={closeReplyComposer}
        onOk={() => replyForm.submit()}
        okButtonProps={{ loading: isSubmitting }}
        okText="Send reply"
        open={isReplyModalOpen}
        title="Reply from workspace"
      >
        <Form className={styles.modalForm} form={replyForm} layout="vertical" onFinish={handleReplySubmit}>
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

      <Modal
        forceRender
        onCancel={closeAssignModal}
        onOk={() => assignmentForm.submit()}
        okButtonProps={{ loading: isSubmitting }}
        okText="Assign reps"
        open={isAssignModalOpen}
        title="Assign the right sales reps"
      >
        <Form className={styles.modalForm} form={assignmentForm} layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item
            label="Representatives"
            name="representativeIds"
            rules={[{ message: "Choose at least one representative", required: true }]}
          >
            <Select
              mode="multiple"
              options={representativeOptions}
              placeholder="Select one or more representatives"
            />
          </Form.Item>
          <Form.Item
            label="Client-facing assignment message"
            name="assignmentMessage"
            rules={[{ message: "Add the assignment message", required: true }]}
          >
            <Input.TextArea
              placeholder="Explain who is being assigned and why"
              rows={5}
            />
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
