import { createFileRoute } from "@tanstack/react-router";
import { Trash2, UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	useProjectMembers,
	useRemoveMember,
	useShareProject,
} from "@/hooks/use-project-members";
import { useProject } from "@/hooks/use-projects";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectId/members",
)({
	component: ProjectMembersPage,
});

function ProjectMembersPage() {
	const { projectId } = Route.useParams();
	const { data: session } = useSession();
	const { data: project } = useProject(projectId);
	const { data, isPending } = useProjectMembers(projectId);
	const isOwner = project?.role === "owner";

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Members</h2>
			</div>

			{isOwner && <ShareForm projectId={projectId} />}

			{isPending ? (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			) : data?.data.length ? (
				<div className="space-y-2">
					{data.data.map((member) => (
						<MemberRow
							key={member.id}
							member={member}
							projectId={projectId}
							isOwner={isOwner}
							currentUserId={session?.user?.id}
						/>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground">
						No members found.
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function ShareForm({ projectId }: { projectId: string }) {
	const shareProject = useShareProject(projectId);
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setError("");
		shareProject.mutate(email, {
			onSuccess: () => setEmail(""),
			onError: (err) => setError(err.message),
		});
	};

	return (
		<Card>
			<CardContent className="pt-6">
				<form onSubmit={handleSubmit} className="flex gap-2">
					<div className="flex-1">
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="user@example.com"
							required
						/>
						{error && <p className="mt-1 text-destructive text-xs">{error}</p>}
					</div>
					<Button
						type="submit"
						size="sm"
						disabled={!email.trim() || shareProject.isPending}
					>
						<UserPlus className="mr-2 size-4" />
						{shareProject.isPending ? "Sharing..." : "Share"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

function MemberRow({
	member,
	projectId,
	isOwner,
	currentUserId,
}: {
	member: {
		id: string;
		userId: string;
		userName: string;
		userEmail: string;
		role: string;
	};
	projectId: string;
	isOwner: boolean;
	currentUserId?: string | undefined;
}) {
	const removeMember = useRemoveMember(projectId);
	const canRemove = isOwner && member.role !== "owner";
	const isSelf = member.userId === currentUserId;

	return (
		<div className="flex items-center justify-between rounded-lg border p-3">
			<div className="flex items-center gap-3">
				<div className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
					{member.userName.charAt(0).toUpperCase()}
				</div>
				<div>
					<p className="font-medium text-sm">
						{member.userName}
						{isSelf && (
							<span className="ml-1 text-muted-foreground">(you)</span>
						)}
					</p>
					<p className="text-muted-foreground text-xs">{member.userEmail}</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Badge variant={member.role === "owner" ? "default" : "secondary"}>
					{member.role}
				</Badge>
				{canRemove && (
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={() => removeMember.mutate(member.id)}
						disabled={removeMember.isPending}
					>
						<Trash2 className="size-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
