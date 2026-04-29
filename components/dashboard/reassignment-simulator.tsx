"use client";

import { Alert, Button, Card, Checkbox, Select, Space, Spin, Statistic, Table, Tag, Typography } from "antd";
import type { DefaultOptionType } from "antd/es/select";
import { useMemo, useState } from "react";

import { getPrimaryUserRole, isManagerRole } from "@/lib/auth/roles";
import { useActivityActions, useActivityState } from "@/providers/activityProvider";
import { useAuthState } from "@/providers/authProvider";
import { useClientState } from "@/providers/clientProvider";
import { useDashboardActions, useDashboardState } from "@/providers/dashboardProvider";
import { useOpportunityActions } from "@/providers/opportunityProvider";
import { formatCurrency, getDaysUntil } from "@/providers/salesSelectors";
import { PRIORITY_BAND_COLORS } from "@/providers/salesTypes";
import type {
  IReassignmentSimulationResponse,
} from "@/types/reassignment";

const MAX_SELECTED_DEALS = 3;

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function ReassignmentSimulator() {
  const { user } = useAuthState();
  const { salesData, teamMembers } = useDashboardState();
  const { clients } = useClientState();
  const { activities } = useActivityState();
  const { updateOpportunity } = useOpportunityActions();
  const { updateActivity } = useActivityActions();
  const { addAutomationEvent } = useDashboardActions();
  const [selectedOpportunityIds, setSelectedOpportunityIds] = useState<string[]>([]);
  const [targetOwnerId, setTargetOwnerId] = useState<string>();
  const [moveFollowUps, setMoveFollowUps] = useState(true);
  const [result, setResult] = useState<IReassignmentSimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isAdmin = isManagerRole(getPrimaryUserRole(user?.roles));
  const openOpportunities = useMemo(
    () =>
      salesData.opportunities.filter(
        (opportunity) => !["Won", "Lost"].includes(String(opportunity.stage)),
      ),
    [salesData.opportunities],
  );

  const opportunityOptions = useMemo(
    () =>
      openOpportunities.map((opportunity) => {
        const clientName =
          clients.find((client) => client.id === opportunity.clientId)?.name ?? "Client pending";
        const daysToClose = getDaysUntil(opportunity.expectedCloseDate);
        const deadlineLabel = daysToClose <= 0 ? "Past due" : `${daysToClose} days to close`;
        const value = opportunity.value ?? opportunity.estimatedValue;

        return {
          clientName,
          deadlineLabel,
          label: `${opportunity.title} - ${clientName} - ${deadlineLabel}`,
          opportunityTitle: opportunity.title,
          valueLabel: formatCurrency(value),
          value: opportunity.id,
        };
      }),
    [clients, openOpportunities],
  );

  const ownerOptions = useMemo(
    () =>
      teamMembers.map((member) => ({
        label: `${member.name} - ${member.role}`,
        value: member.id,
      })),
    [teamMembers],
  );

  const renderOpportunityOption = (option: DefaultOptionType) => {
    const opportunityTitle =
      typeof option.opportunityTitle === "string" ? option.opportunityTitle : "";
    const clientName = typeof option.clientName === "string" ? option.clientName : "";
    const deadlineLabel = typeof option.deadlineLabel === "string" ? option.deadlineLabel : "";
    const valueLabel = typeof option.valueLabel === "string" ? option.valueLabel : "";

    return (
      <div className="dashboard-reassignment-option">
        <Typography.Text className="block !font-semibold !text-slate-900">
          {opportunityTitle}
        </Typography.Text>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{clientName}</span>
          <span>{deadlineLabel}</span>
          <span>{valueLabel}</span>
        </div>
      </div>
    );
  };

  const runSimulation = async () => {
    if (!targetOwnerId || selectedOpportunityIds.length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/reassignment-simulator", {
        body: JSON.stringify({
          opportunityIds: selectedOpportunityIds,
          salesData,
          targetOwnerId,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const payload = (await response.json()) as
        | IReassignmentSimulationResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error("message" in payload ? payload.message : "Simulation failed.");
      }

      setResult(payload as IReassignmentSimulationResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "The reassignment simulator could not process this request.",
      );
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const applyScenario = () => {
    if (!result || !targetOwnerId) {
      return;
    }

    const targetOwner = teamMembers.find((member) => member.id === targetOwnerId);

    if (!targetOwner) {
      setError("The selected target owner could not be found.");
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      selectedOpportunityIds.forEach((opportunityId) => {
        updateOpportunity(opportunityId, { ownerId: targetOwnerId });
      });

      if (moveFollowUps) {
        activities
          .filter(
            (activity) =>
              selectedOpportunityIds.includes(activity.relatedToId) &&
              !activity.completed &&
              String(activity.status) !== "Completed",
          )
          .forEach((activity) => {
            updateActivity(activity.id, {
              assignedToId: targetOwner.id,
              assignedToName: targetOwner.name,
            });
          });
      }

      addAutomationEvent({
        createdAt: new Date().toISOString(),
        description: `${result.movedDealCount} deal${
          result.movedDealCount === 1 ? "" : "s"
        } were reassigned to ${targetOwner.name}. ${
          moveFollowUps
            ? `${result.followUpsToReassign} open follow-up${
                result.followUpsToReassign === 1 ? "" : "s"
              } moved with the deals.`
            : "Related follow-ups stayed with their current assignees."
        }`,
        id: createId("auto"),
        title: `Reassignment applied to ${targetOwner.name}`,
      });

      setSuccessMessage(`Reassignment applied to ${targetOwner.name}.`);
      setResult(null);
      setSelectedOpportunityIds([]);
      setTargetOwnerId(undefined);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card title="Reassignment simulator">
        <Alert
          description="Only admins and sales managers can test and apply deal reassignments."
          showIcon
          type="info"
        />
      </Card>
    );
  }

  return (
    <Card
      className="h-full"
      title="Reassignment simulator"
      extra={
        <Typography.Text className="!text-slate-500">
          Move up to three deals and test the impact first
        </Typography.Text>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.9fr)]">
          <Select
            className="dashboard-reassignment-deals-select w-full"
            disabled={Boolean(result) || isApplying || isLoading}
            mode="multiple"
            maxCount={MAX_SELECTED_DEALS}
            maxTagCount={1}
            optionRender={(option) => renderOpportunityOption(option.data)}
            onChange={(value) => setSelectedOpportunityIds(value)}
            options={opportunityOptions}
            placeholder="Select up to 3 live deals"
            popupMatchSelectWidth={false}
            showSearch
            size="large"
            tagRender={(tagProps) => {
              const selectedCount = selectedOpportunityIds.length;

              if (selectedCount === 0) {
                return <span className="hidden" />;
              }

              const isFirstTag = tagProps.value === selectedOpportunityIds[0];

              if (!isFirstTag) {
                return <span className="hidden" />;
              }

              return (
                <span className="dashboard-reassignment-deals-tag">
                  {selectedCount} deal{selectedCount === 1 ? "" : "s"} selected
                </span>
              );
            }}
            value={selectedOpportunityIds}
          />

          <Select
            className="w-full"
            disabled={Boolean(result) || isApplying || isLoading}
            onChange={(value) => setTargetOwnerId(value)}
            options={ownerOptions}
            placeholder="Select the target owner"
            showSearch
            value={targetOwnerId}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Checkbox
            checked={moveFollowUps}
            disabled={Boolean(result) || isApplying || isLoading}
            onChange={(event) => setMoveFollowUps(event.target.checked)}
          >
            Move open follow-ups when applying
          </Checkbox>
          <Space wrap>
            <Button
              disabled={
                !targetOwnerId ||
                selectedOpportunityIds.length === 0 ||
                isLoading ||
                isApplying ||
                Boolean(result)
              }
              onClick={() => void runSimulation()}
              type="primary"
            >
              Run simulation
            </Button>
            <Button
              disabled={selectedOpportunityIds.length === 0 && !result}
              onClick={() => {
                setError(null);
                setResult(null);
                setSelectedOpportunityIds([]);
                setTargetOwnerId(undefined);
                setSuccessMessage(null);
              }}
            >
              Reset
            </Button>
          </Space>
        </div>

        {error ? <Alert description={error} showIcon type="error" /> : null}
        {successMessage ? <Alert description={successMessage} showIcon type="success" /> : null}

        {isLoading ? (
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-slate-500">
            <Spin size="small" />
            <span>Running reassignment analysis...</span>
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <Alert
              description={result.summary}
              title={`${result.recommendation} - ${result.scenarioRisk} risk`}
              showIcon
              type={
                result.recommendation === "Hold"
                  ? "error"
                  : result.recommendation === "Proceed with support"
                    ? "warning"
                    : "success"
              }
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card size="small">
                <Statistic title="Moved value" value={result.totalValue} prefix="R " precision={0} />
              </Card>
              <Card size="small">
                <Statistic title="Urgent deals" value={result.urgentDealCount} />
              </Card>
              <Card size="small">
                <Statistic title="Open follow-ups" value={result.followUpsToReassign} />
              </Card>
              <Card size="small">
                <Statistic title="Deals moved" value={result.movedDealCount} />
              </Card>
            </div>

            {result.warnings.length > 0 ? (
              <Card size="small" title="Watch-outs">
                <div className="space-y-2">
                  {result.warnings.map((warning) => (
                    <Typography.Paragraph className="!mb-0 !text-slate-600" key={warning}>
                      {warning}
                    </Typography.Paragraph>
                  ))}
                </div>
              </Card>
            ) : null}

            <Table
              columns={[
                {
                  dataIndex: "title",
                  key: "title",
                  title: "Deal",
                  width: 220,
                },
                {
                  dataIndex: "clientName",
                  key: "clientName",
                  title: "Client",
                  width: 150,
                },
                {
                  dataIndex: "priorityBand",
                  key: "priorityBand",
                  render: (priorityBand: string) => (
                    <Tag color={PRIORITY_BAND_COLORS[priorityBand as keyof typeof PRIORITY_BAND_COLORS]}>
                      {priorityBand}
                    </Tag>
                  ),
                  title: "Priority",
                  width: 110,
                },
                {
                  dataIndex: "daysToClose",
                  key: "daysToClose",
                  render: (daysToClose: number) =>
                    daysToClose <= 0 ? "Past due" : `${daysToClose} days`,
                  title: "Deadline",
                  width: 110,
                },
                {
                  dataIndex: "currentOwnerName",
                  key: "currentOwnerName",
                  title: "Current owner",
                  width: 160,
                },
                {
                  dataIndex: "targetOwnerName",
                  key: "targetOwnerName",
                  title: "Target owner",
                  width: 160,
                },
                {
                  dataIndex: "openFollowUps",
                  key: "openFollowUps",
                  title: "Open follow-ups",
                  width: 130,
                },
                {
                  dataIndex: "value",
                  key: "value",
                  render: (value: number) => formatCurrency(value),
                  title: "Value",
                  width: 130,
                },
              ]}
              dataSource={result.deals}
              pagination={false}
              rowKey="opportunityId"
              scroll={{ x: 1170 }}
              size="small"
            />

            <Table
              columns={[
                {
                  dataIndex: "memberName",
                  key: "memberName",
                  title: "Team member",
                  width: 170,
                },
                {
                  dataIndex: "role",
                  key: "role",
                  title: "Role",
                  width: 150,
                },
                {
                  key: "liveDeals",
                  render: (_, record) => `${record.beforeAssignments} -> ${record.afterAssignments}`,
                  title: "Live deals",
                  width: 110,
                },
                {
                  key: "urgentDeals",
                  render: (_, record) => `${record.beforeUrgentDeals} -> ${record.afterUrgentDeals}`,
                  title: "Urgent deals",
                  width: 110,
                },
                {
                  key: "capacity",
                  render: (_, record) =>
                    `${record.beforeAvailableCapacity}% -> ${record.afterAvailableCapacity}%`,
                  title: "Capacity",
                  width: 140,
                },
              ]}
              dataSource={result.ownerImpacts}
              pagination={false}
              rowKey="memberId"
              size="small"
            />

            <div className="flex justify-end">
              <Button loading={isApplying} onClick={applyScenario} type="primary">
                Apply reassignment
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
