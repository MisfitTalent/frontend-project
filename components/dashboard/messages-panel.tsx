"use client";
import { CheckOutlined, MessageOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Card, Empty, Form, Input, Modal, Select, Space, Tag, Typography, message, } from "antd";
import { useEffect, useMemo, useState } from "react";
import { isClientScopedUser } from "@/lib/auth/dashboard-access";
import { getPrimaryUserRole } from "@/lib/auth/roles";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import type { INoteItem } from "@/providers/domainSeeds";
import { useNoteActions, useNoteState } from "@/providers/noteProvider";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { ClientMessageCenter } from "./client-message-center";
import { AnimatedDashboardTable } from "./animated-dashboard-table";
import { useStyles } from "./messages-panel.styles";
type ReplyFormValues = {
    clientId: string;
    content: string;
    representativeId: string;
    subject: string;
};
const CLIENT_MESSAGE_CATEGORY = "Client Message";
const LEGACY_CLIENT_MESSAGE_PREFIX = `${CLIENT_MESSAGE_CATEGORY} `;
const clientFacingRole = (role: string) => [
    "Account Executive",
    "Sales Consultant",
    "Client Success",
    "Business Development",
    "Pipeline Director",
].some((token) => role.includes(token));
const createMessageId = () => `message-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const isMessageNote = (note: INoteItem) => note.kind === "client_message" ||
    note.category === CLIENT_MESSAGE_CATEGORY ||
    note.category?.startsWith(LEGACY_CLIENT_MESSAGE_PREFIX);
const getRepresentativeName = (note: INoteItem) => {
    if (note.representativeName) {
        return note.representativeName;
    }
    if (note.category?.startsWith(LEGACY_CLIENT_MESSAGE_PREFIX)) {
        return note.category
            .slice(LEGACY_CLIENT_MESSAGE_PREFIX.length)
            .replace(/^[-\u2022]\s*/, "");
    }
    return "Account team";
};
const getSourceLabel = (note: INoteItem) => {
    switch (note.source) {
        case "workspace":
            return "Account team";
        case "assistant":
            return "Advisor";
        case "client_portal":
        default:
            return "Client";
    }
};
const getSourceColor = (note: INoteItem) => {
    switch (note.source) {
        case "workspace":
            return "gold";
        case "assistant":
            return "purple";
        case "client_portal":
        default:
            return "default";
    }
};
const getStatusColor = (status?: INoteItem["status"]) => {
    switch (status) {
        case "Acknowledged":
            return "green";
        case "Sent":
        default:
            return "blue";
    }
};
export const MessagesPanel = () => {
    const { user } = useAuthState();
    const { clients } = useClientState();
    const { teamMembers } = useDashboardState();
    const { opportunities } = useOpportunityState();
    const { notes } = useNoteState();
    const { addNote, updateNote } = useNoteActions();
    const { styles } = useStyles();
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>("all");
    const [selectedRepresentativeId, setSelectedRepresentativeId] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
    const [form] = Form.useForm<ReplyFormValues>();
    const role = getPrimaryUserRole(user?.roles);
    const isClientScoped = isClientScopedUser(user?.clientIds);
    const accessibleClientIds = useMemo(() => new Set(user?.clientIds ?? []), [user?.clientIds]);
    const repOwnedClientIds = useMemo(() => new Set(opportunities
        .filter((opportunity) => opportunity.ownerId === user?.userId)
        .map((opportunity) => opportunity.clientId)), [opportunities, user?.userId]);
    const representativeOptions = useMemo(() => teamMembers
        .filter((member) => clientFacingRole(member.role))
        .map((member) => ({
        label: member.name,
        value: member.id,
    }))
        .sort((left, right) => left.label.localeCompare(right.label)), [teamMembers]);
    const baseMessages = useMemo(() => {
        const items = notes.filter(isMessageNote);
        if (isClientScoped) {
            return items.filter((note) => !!note.clientId && accessibleClientIds.has(note.clientId));
        }
        if (role === "SalesRep") {
            return items.filter((note) => note.representativeId === user?.userId ||
                (!!note.clientId && repOwnedClientIds.has(note.clientId)));
        }
        return items;
    }, [accessibleClientIds, isClientScoped, notes, repOwnedClientIds, role, user?.userId]);
    const filteredMessages = useMemo(() => baseMessages
        .filter((note) => selectedClientId === "all" || note.clientId === selectedClientId)
        .filter((note) => selectedRepresentativeId === "all" ||
        note.representativeId === selectedRepresentativeId ||
        getRepresentativeName(note) === selectedRepresentativeId)
        .filter((note) => selectedStatus === "all" || (note.status ?? "Sent") === selectedStatus)
        .sort((left, right) => right.createdDate.localeCompare(left.createdDate)), [baseMessages, selectedClientId, selectedRepresentativeId, selectedStatus]);
    const summary = useMemo(() => {
        const pending = baseMessages.filter((note) => note.source === "client_portal" && note.status !== "Acknowledged").length;
        const replies = baseMessages.filter((note) => note.source === "workspace").length;
        const clientCount = new Set(baseMessages.map((note) => note.clientId).filter(Boolean)).size;
        const representatives = new Set(baseMessages.map(getRepresentativeName)).size;
        return { clientCount, pending, replies, representatives };
    }, [baseMessages]);
    const availableClientOptions = useMemo(() => clients
        .filter((client) => baseMessages.some((note) => note.clientId === client.id) ||
        (isClientScoped && accessibleClientIds.has(client.id)))
        .map((client) => ({
        label: client.name,
        value: client.id,
    }))
        .sort((left, right) => left.label.localeCompare(right.label)), [accessibleClientIds, baseMessages, clients, isClientScoped]);
    const availableRepresentativeOptions = useMemo(() => Array.from(new Map(baseMessages
        .map((note) => ({
        label: getRepresentativeName(note),
        value: note.representativeId ?? getRepresentativeName(note),
    }))
        .map((option) => [option.value, option])).values()).sort((left, right) => left.label.localeCompare(right.label)), [baseMessages]);
    const openReplyComposer = (target?: INoteItem) => {
        const defaultClientId = target?.clientId ??
            availableClientOptions[0]?.value ??
            (isClientScoped ? user?.clientIds?.[0] ?? "" : "");
        const defaultRepresentativeId = target?.representativeId ??
            representativeOptions[0]?.value ??
            "";
        setReplyTargetId(target?.id ?? null);
        form.setFieldsValue({
            clientId: defaultClientId,
            content: target?.source === "client_portal"
                ? `Hello, we have received your message about ${target.title.toLowerCase()}.`
                : undefined,
            representativeId: defaultRepresentativeId,
            subject: target ? `Re: ${target.title}` : "Account message",
        });
        setIsModalOpen(true);
    };
    const closeReplyComposer = () => {
        setIsModalOpen(false);
        setReplyTargetId(null);
        form.resetFields();
    };
    const handleAcknowledge = async (note: INoteItem) => {
        try {
            await updateNote(note.id, { status: "Acknowledged" });
            messageApi.success("Message acknowledged.");
        }
        catch (error) {
            console.error(error);
            messageApi.error("Could not update the message status.");
        }
    };
    const handleReply = async (values: ReplyFormValues) => {
        const representative = representativeOptions.find((option) => option.value === values.representativeId);
        const target = replyTargetId
            ? baseMessages.find((note) => note.id === replyTargetId)
            : undefined;
        if (!representative) {
            messageApi.error("Please choose a representative before sending the reply.");
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
                representativeId: representative.value,
                representativeName: representative.label,
                source: "workspace",
                status: "Sent",
                submittedBy: user?.email ?? undefined,
                title: values.subject.trim(),
            });
            if (target && target.status !== "Acknowledged") {
                await updateNote(target.id, { status: "Acknowledged" });
            }
            messageApi.success("Reply sent to the client workspace.");
            closeReplyComposer();
        }
        catch (error) {
            console.error(error);
            messageApi.error("Could not send the reply.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    useEffect(() => {
        if (!isClientScoped) {
            return;
        }
        const unreadWorkspaceReplies = baseMessages.filter((note) => note.source === "workspace" && note.status !== "Acknowledged");
        if (unreadWorkspaceReplies.length === 0) {
            return;
        }
        void Promise.all(unreadWorkspaceReplies.map((note) => updateNote(note.id, { status: "Acknowledged" }))).catch((error) => {
            console.error(error);
        });
    }, [baseMessages, isClientScoped, updateNote]);
    if (isClientScoped) {
        const clientMessages = filteredMessages;
        return (<div className={styles.container}>
        {contextHolder}
        <div className={styles.cardGridThree}>
          <Card className={styles.card}>
            <Typography.Text className={styles.metricLabel}>Messages</Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {clientMessages.length}
            </Typography.Title>
            <Typography.Text className={styles.metricText}>
              Messages shared in this client workspace.
            </Typography.Text>
          </Card>
          <Card className={styles.card}>
            <Typography.Text className={styles.metricLabel}>Awaiting reply</Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {clientMessages.filter((note) => note.source === "client_portal" && note.status !== "Acknowledged").length}
            </Typography.Title>
            <Typography.Text className={styles.metricText}>
              Messages still waiting for an account-team response.
            </Typography.Text>
          </Card>
          <Card className={styles.card}>
            <Typography.Text className={styles.metricLabel}>Account-team replies</Typography.Text>
            <Typography.Title className={styles.metricTitle} level={3}>
              {clientMessages.filter((note) => note.source === "workspace").length}
            </Typography.Title>
            <Typography.Text className={styles.metricText}>
              Messages already shared back to your workspace.
            </Typography.Text>
          </Card>
        </div>

        <Card className={styles.card}>
          <div className={styles.header}>
            <div className={styles.headerCopy}>
              <Typography.Title className={styles.sectionTitle} level={4}>
                Message history
              </Typography.Title>
              <Typography.Text className={styles.sectionText}>
                Review the conversation across your account representatives.
              </Typography.Text>
            </div>
            <Select className={styles.filterSelectXl} onChange={setSelectedRepresentativeId} options={[
                { label: "All representatives", value: "all" },
                ...availableRepresentativeOptions,
            ]} value={selectedRepresentativeId}/>
          </div>
        </Card>

        <ClientMessageCenter />
      </div>);
    }
    return (<div className={styles.container}>
      {contextHolder}

      <div className={styles.cardGridFour}>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Active clients</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {summary.clientCount}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Client accounts with visible message history.
          </Typography.Text>
        </Card>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Pending client messages</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {summary.pending}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Client messages still waiting for acknowledgement.
          </Typography.Text>
        </Card>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Replies sent</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {summary.replies}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Workspace replies already sent back to clients.
          </Typography.Text>
        </Card>
        <Card className={styles.card}>
          <Typography.Text className={styles.metricLabel}>Representatives involved</Typography.Text>
          <Typography.Title className={styles.metricTitle} level={3}>
            {summary.representatives}
          </Typography.Title>
          <Typography.Text className={styles.metricText}>
            Account-team members linked to current conversations.
          </Typography.Text>
        </Card>
      </div>

      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <Typography.Title className={styles.sectionTitle} level={4}>
              Client conversations
            </Typography.Title>
            <Typography.Text className={styles.sectionText}>
              Review incoming client messages, acknowledge them, and reply from the workspace.
            </Typography.Text>
          </div>
          <Button icon={<SendOutlined />} onClick={() => openReplyComposer()} type="primary">
            New reply
          </Button>
        </div>

        <div className={styles.filterBar}>
          <Select className={styles.filterSelectLg} onChange={setSelectedClientId} options={[
            { label: "All clients", value: "all" },
            ...availableClientOptions,
        ]} value={selectedClientId}/>
          <Select className={styles.filterSelectMd} onChange={setSelectedStatus} options={[
            { label: "All statuses", value: "all" },
            { label: "Sent", value: "Sent" },
            { label: "Acknowledged", value: "Acknowledged" },
        ]} value={selectedStatus}/>
        </div>

        <div className={styles.tableWrap}>
          {filteredMessages.length === 0 ? (<Empty description="No client messages match the current filters." image={Empty.PRESENTED_IMAGE_SIMPLE}/>) : (<AnimatedDashboardTable columns={[
                {
                    key: "client",
                    render: (_: unknown, record: INoteItem) => clients.find((client) => client.id === record.clientId)?.name ?? "Unassigned client",
                    title: "Client",
                },
                {
                    dataIndex: "title",
                    key: "title",
                    title: "Subject",
                },
                {
                    key: "representative",
                    render: (_: unknown, record: INoteItem) => getRepresentativeName(record),
                    title: "Representative",
                },
                {
                    key: "source",
                    render: (_: unknown, record: INoteItem) => (<Tag color={getSourceColor(record)}>{getSourceLabel(record)}</Tag>),
                    title: "From",
                },
                {
                    key: "status",
                    render: (_: unknown, record: INoteItem) => (<Tag color={getStatusColor(record.status)}>{record.status ?? "Sent"}</Tag>),
                    title: "Status",
                },
                {
                    dataIndex: "createdDate",
                    key: "createdDate",
                    title: "Date",
                },
                {
                    key: "actions",
                    render: (_: unknown, record: INoteItem) => (<Space size="small" wrap>
                      {record.source === "client_portal" && record.status !== "Acknowledged" ? (<Button icon={<CheckOutlined />} onClick={() => void handleAcknowledge(record)} size="small">
                          Acknowledge
                        </Button>) : null}
                      <Button icon={<MessageOutlined />} onClick={() => openReplyComposer(record)} size="small">
                        Reply
                      </Button>
                    </Space>),
                    title: "Actions",
                },
            ]} dataSource={filteredMessages} emptyDescription="No client messages yet" rowKey="id"/>)}
        </div>
      </Card>

      <div className={styles.messageList}>
        {filteredMessages.slice(0, 6).map((note) => (<div className={styles.messageCard} key={`thread-${note.id}`}>
            <div className={styles.messageHeader}>
              <div className={styles.headerCopy}>
                <Typography.Title className={styles.messageTitle} level={5}>
                  {note.title}
                </Typography.Title>
                <Space size="small" wrap>
                  <Tag color="default">
                    {clients.find((client) => client.id === note.clientId)?.name ?? "Client"}
                  </Tag>
                  <Tag color={getSourceColor(note)}>{getSourceLabel(note)}</Tag>
                  <Tag color="geekblue">{getRepresentativeName(note)}</Tag>
                  <Tag color={getStatusColor(note.status)}>{note.status ?? "Sent"}</Tag>
                </Space>
              </div>
              <Typography.Text className={styles.messageFooter}>{note.createdDate}</Typography.Text>
            </div>
            <Typography.Paragraph className={styles.messageText}>
              {note.content}
            </Typography.Paragraph>
          </div>))}
      </div>

      <Modal forceRender onCancel={closeReplyComposer} onOk={() => form.submit()} okButtonProps={{ loading: isSubmitting }} okText="Send reply" open={isModalOpen} title="Reply to client">
        <Form className={styles.modalForm} form={form} layout="vertical" onFinish={handleReply}>
          <Form.Item label="Client" name="clientId" rules={[{ message: "Please choose a client", required: true }]}>
            <Select options={availableClientOptions} placeholder="Choose a client"/>
          </Form.Item>

          <Form.Item label="Representative" name="representativeId" rules={[{ message: "Please choose a representative", required: true }]}>
            <Select options={representativeOptions} placeholder="Choose a representative"/>
          </Form.Item>

          <Form.Item label="Subject" name="subject" rules={[{ message: "Please add a subject", required: true }]}>
            <Input placeholder="e.g. Re: Proposal walkthrough"/>
          </Form.Item>

          <Form.Item label="Message" name="content" rules={[{ message: "Please enter your reply", required: true }]}>
            <Input.TextArea rows={5}/>
          </Form.Item>
        </Form>
      </Modal>
    </div>);
};
