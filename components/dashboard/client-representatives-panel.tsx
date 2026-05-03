"use client";
import { CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Form, Input, Modal, Row, Select, Space, Tag, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { useAuthState } from "@/providers/authProvider";
import { useActivityActions, useActivityState } from "@/providers/activityProvider";
import { useClientState } from "@/providers/clientProvider";
import { useContactState } from "@/providers/contactProvider";
import { useDashboardState } from "@/providers/dashboardProvider";
import { ActivityStatus, ActivityType, type IActivity, type ITeamMember } from "@/providers/salesTypes";
import { useOpportunityState } from "@/providers/opportunityProvider";
import { useStyles } from "./client-representatives-panel.styles";
type ClientRepresentativesPanelProps = Readonly<{
    compact?: boolean;
}>;
type MeetingRequestFormValues = {
    details?: string;
    requestedDate: string;
    representativeId: string;
    topic: string;
};
type RepresentativeCard = ITeamMember & {
    activeCallsAndMeetings: number;
    availabilityLabel: string;
    availabilityTone: "default" | "gold" | "green" | "volcano";
    fitReason: string;
    isAccountLead: boolean;
    score: number;
    skillMatches: string[];
};
const clientFacingRole = (role: string) => ["Account Executive", "Sales Consultant", "Client Success", "Business Development", "Pipeline Director"].some((token) => role.includes(token));
const availabilityToneFor = (availabilityPercent: number): RepresentativeCard["availabilityTone"] => {
    if (availabilityPercent >= 78) {
        return "green";
    }
    if (availabilityPercent >= 65) {
        return "gold";
    }
    return "volcano";
};
const availabilityLabelFor = (availabilityPercent: number) => {
    if (availabilityPercent >= 78) {
        return "High availability";
    }
    if (availabilityPercent >= 65) {
        return "Available this week";
    }
    return "Limited availability";
};
const createActivityId = () => `client-meeting-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const ClientRepresentativesPanel = ({ compact = false, }: ClientRepresentativesPanelProps) => {
    const { user } = useAuthState();
    const { clients } = useClientState();
    const { contacts } = useContactState();
    const { opportunities } = useOpportunityState();
    const { teamMembers } = useDashboardState();
    const { activities } = useActivityState();
    const { addActivity } = useActivityActions();
    const { styles } = useStyles();
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form] = Form.useForm<MeetingRequestFormValues>();
    const primaryClientId = user?.clientIds?.[0];
    const client = clients.find((item) => item.id === primaryClientId) ?? clients[0];
    const primaryContact = client
        ? contacts.find((contact) => contact.clientId === client.id && contact.isPrimaryContact) ??
            contacts.find((contact) => contact.clientId === client.id)
        : undefined;
    const representativeCards = useMemo<RepresentativeCard[]>(() => {
        if (!client) {
            return [];
        }
        const accountLeadIds = new Set(opportunities
            .filter((opportunity) => opportunity.clientId === client.id && opportunity.ownerId)
            .map((opportunity) => opportunity.ownerId as string));
        const clientTerms = [client.industry, client.segment]
            .filter(Boolean)
            .map((term) => String(term).toLowerCase());
        return teamMembers
            .filter((member) => clientFacingRole(member.role))
            .map((member) => {
            const skillMatches = member.skills.filter((skill) => clientTerms.some((term) => term.includes(skill.toLowerCase()) || skill.toLowerCase().includes(term)));
            const activeCallsAndMeetings = activities.filter((activity) => activity.assignedToId === member.id &&
                ["Meeting", "Call"].includes(String(activity.type)) &&
                activity.status !== "Completed" &&
                !activity.completed).length;
            const isAccountLead = accountLeadIds.has(member.id);
            const fitReason = isAccountLead
                ? "Current account lead"
                : skillMatches.length > 0
                    ? `Relevant skills: ${skillMatches.slice(0, 2).join(", ")}`
                    : `${member.region} coverage`;
            return {
                ...member,
                activeCallsAndMeetings,
                availabilityLabel: availabilityLabelFor(member.availabilityPercent),
                availabilityTone: availabilityToneFor(member.availabilityPercent),
                fitReason,
                isAccountLead,
                score: (isAccountLead ? 100 : 0) +
                    skillMatches.length * 20 +
                    member.availabilityPercent -
                    activeCallsAndMeetings * 4,
                skillMatches,
            };
        })
            .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
    }, [activities, client, opportunities, teamMembers]);
    const displayedRepresentatives = representativeCards.slice(0, compact ? 3 : 6);
    const openMeetingRequest = (representativeId?: string) => {
        const defaultRepresentativeId = representativeId ?? displayedRepresentatives[0]?.id ?? representativeCards[0]?.id ?? "";
        form.setFieldsValue({
            details: client
                ? `Please help us schedule time to discuss ${client.name}.`
                : undefined,
            representativeId: defaultRepresentativeId,
            requestedDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
                .toISOString()
                .split("T")[0],
            topic: client ? `${client.name} catch-up` : "Client catch-up",
        });
        setIsModalOpen(true);
    };
    const closeModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };
    const handleSubmit = async (values: MeetingRequestFormValues) => {
        const representative = representativeCards.find((member) => member.id === values.representativeId);
        if (!representative) {
            messageApi.error("Please choose a representative for this meeting request.");
            return;
        }
        setIsSubmitting(true);
        try {
            const request: IActivity = {
                assignedToId: representative.id,
                assignedToName: representative.name,
                completed: false,
                description: [
                    values.details?.trim(),
                    primaryContact
                        ? `Requested by ${primaryContact.firstName} ${primaryContact.lastName} (${primaryContact.email}).`
                        : user?.email
                            ? `Requested by ${user.email}.`
                            : undefined,
                ]
                    .filter(Boolean)
                    .join("\n\n"),
                dueDate: values.requestedDate,
                id: createActivityId(),
                priority: 2,
                relatedToId: client?.id ?? "",
                relatedToType: 2,
                status: ActivityStatus.Scheduled,
                subject: `Meeting request: ${values.topic}`,
                title: `Meeting request: ${values.topic}`,
                type: ActivityType.Meeting,
            };
            await addActivity(request);
            messageApi.success(`Meeting request added for ${representative.name}.`);
            closeModal();
        }
        catch (error) {
            console.error(error);
            messageApi.error("Could not create the meeting request.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (!client) {
        return (<Card className={styles.card}>
        <Empty description="No client account is linked to this workspace yet." image={Empty.PRESENTED_IMAGE_SIMPLE}/>
      </Card>);
    }
    return (<div className={compact ? styles.containerCompact : styles.containerFull}>
      {contextHolder}

      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <Typography.Title className={styles.title} level={compact ? 4 : 3}>
            Meet your representatives
          </Typography.Title>
          <Typography.Text className={styles.mutedText}>
            See who can support your account and request time with a representative directly in the portal.
          </Typography.Text>
        </div>
        {!compact ? (<Button icon={<CalendarOutlined />} onClick={() => openMeetingRequest()} type="primary">
            Request a meeting
          </Button>) : null}
      </div>

      <Row gutter={[16, 16]}>
        {displayedRepresentatives.map((representative) => (<Col key={representative.id} xs={24} md={12} xl={compact ? 8 : 12}>
            <Card className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.header}>
                  <div className={styles.headerCopy}>
                    <Typography.Title className={styles.title} level={4}>
                      {representative.name}
                    </Typography.Title>
                    <Typography.Text className={styles.mutedText}>
                      {representative.role}
                    </Typography.Text>
                  </div>
                  <Space wrap>
                    {representative.isAccountLead ? (<Tag color="geekblue">Account lead</Tag>) : null}
                    <Tag color={representative.availabilityTone}>
                      {representative.availabilityPercent}% free
                    </Tag>
                  </Space>
                </div>

                <Space size="small" wrap>
                  <Tag icon={<EnvironmentOutlined />} color="default">
                    {representative.region}
                  </Tag>
                  <Tag icon={<CalendarOutlined />} color="default">
                    {representative.activeCallsAndMeetings} active calls/meetings
                  </Tag>
                </Space>

                <Typography.Paragraph className={styles.mutedParagraph}>
                  {representative.fitReason}. {representative.availabilityLabel.toLowerCase()} for new requests.
                </Typography.Paragraph>

                <div className={styles.skillList}>
                  {representative.skills.slice(0, compact ? 2 : 3).map((skill) => (<Tag color="blue" key={`${representative.id}-${skill}`}>
                      {skill}
                    </Tag>))}
                </div>

                <Button icon={<CalendarOutlined />} onClick={() => openMeetingRequest(representative.id)} type="primary">
                  Request meeting
                </Button>
              </div>
            </Card>
          </Col>))}
      </Row>

      <Modal forceRender onCancel={closeModal} onOk={() => form.submit()} okButtonProps={{ loading: isSubmitting }} okText="Send meeting request" open={isModalOpen} title="Request a meeting">
        <Form className={styles.modalForm} form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Representative" name="representativeId" rules={[{ message: "Please choose a representative", required: true }]}>
            <Select options={representativeCards.map((member) => ({
            label: `${member.name} (${member.availabilityPercent}% free)`,
            value: member.id,
        }))} placeholder="Choose a representative"/>
          </Form.Item>

          <Form.Item label="Requested date" name="requestedDate" rules={[{ message: "Please choose a date", required: true }]}>
            <Input type="date"/>
          </Form.Item>

          <Form.Item label="Topic" name="topic" rules={[{ message: "Please enter a topic", required: true }]}>
            <Input placeholder="e.g. Proposal walkthrough"/>
          </Form.Item>

          <Form.Item label="Details" name="details">
            <Input.TextArea placeholder="Share context for the meeting request" rows={4}/>
          </Form.Item>
        </Form>
      </Modal>
    </div>);
};
