import {
	createFileRoute,
	Link,
	Outlet,
	useMatchRoute,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/hooks/use-projects";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
	component: ProjectLayout,
});

function ProjectLayout() {
	const { projectId } = Route.useParams();
	const { data: project, isPending, isError } = useProject(projectId);
	const matchRoute = useMatchRoute();

	if (isPending) {
		return (
			<div className="flex flex-1 flex-col p-6">
				<div className="mx-auto w-full max-w-4xl space-y-6">
					<div>
						<Skeleton className="mb-2 h-4 w-20" />
						<Skeleton className="h-7 w-64" />
						<Skeleton className="mt-2 h-4 w-96" />
					</div>
					<Skeleton className="h-9 w-56" />
					<div className="space-y-4">
						<Skeleton className="h-32 w-full rounded-lg" />
						<Skeleton className="h-32 w-full rounded-lg" />
					</div>
				</div>
			</div>
		);
	}

	if (isError || !project) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">Project not found</p>
				<Link to="/projects" className="text-primary text-sm underline">
					Back to projects
				</Link>
			</div>
		);
	}

	const isMembersTab = matchRoute({
		to: "/projects/$projectId/members",
		params: { projectId },
	});
	const isFilesTab = matchRoute({
		to: "/projects/$projectId/files",
		params: { projectId },
	});
	const currentTab = isMembersTab ? "members" : isFilesTab ? "files" : "posts";

	return (
		<div className="flex flex-1 flex-col p-6">
			<div className="mx-auto w-full max-w-4xl space-y-6">
				<div>
					<Link
						to="/projects"
						className="mb-2 inline-flex items-center text-muted-foreground text-sm hover:text-foreground"
					>
						<ArrowLeft className="mr-1 size-4" />
						Projects
					</Link>
					<div className="flex items-start justify-between">
						<div>
							<h1 className="font-bold text-2xl">{project.name}</h1>
							{project.description && (
								<p className="mt-1 text-muted-foreground text-sm">
									{project.description}
								</p>
							)}
						</div>
						<Badge variant={project.role === "owner" ? "default" : "secondary"}>
							{project.role}
						</Badge>
					</div>
				</div>

				<Tabs value={currentTab}>
					<TabsList>
						<TabsTrigger value="posts" asChild>
							<Link to="/projects/$projectId" params={{ projectId }}>
								Posts
							</Link>
						</TabsTrigger>
						<TabsTrigger value="files" asChild>
							<Link to="/projects/$projectId/files" params={{ projectId }}>
								Files
							</Link>
						</TabsTrigger>
						<TabsTrigger value="members" asChild>
							<Link to="/projects/$projectId/members" params={{ projectId }}>
								Members
							</Link>
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Outlet />
			</div>
		</div>
	);
}
