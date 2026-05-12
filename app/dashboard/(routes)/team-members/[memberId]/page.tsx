import { TeamMemberDetailView } from "@/components/dashboard/team-member-detail-view";

type TeamMemberDetailPageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function TeamMemberDetailPage({
  params,
}: TeamMemberDetailPageProps) {
  const { memberId } = await params;

  return <TeamMemberDetailView memberId={memberId} />;
}
