import { TeamMemberDetailView } from "@/components/dashboard/team-member-detail-view";
import { TeamProvider } from "@/providers/pageProviders";

type TeamMemberDetailPageProps = {
  params: Promise<{ memberId: string }>;
};

export default async function TeamMemberDetailPage({
  params,
}: TeamMemberDetailPageProps) {
  const { memberId } = await params;

  return (
    <TeamProvider>
      <TeamMemberDetailView memberId={memberId} />
    </TeamProvider>
  );
}
