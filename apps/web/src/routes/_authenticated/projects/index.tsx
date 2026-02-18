import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderPlus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";

export const Route = createFileRoute("/_authenticated/projects/")({
	component: ProjectListPage,
});

function ProjectListPage() {
	const { data, isPending, isError } = useProjects();

	return (
		<div className="flex flex-1 flex-col p-6">
			<div className="mx-auto w-full max-w-4xl space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="font-bold text-2xl">Projects</h1>
						<p className="text-muted-foreground text-sm">
							Manage your projects and collaborations
						</p>
					</div>
					<Button asChild>
						<Link to="/projects/new">
							<Plus className="mr-2 size-4" />
							New Project
						</Link>
					</Button>
				</div>

				{isPending ? (
					<div className="grid gap-4">
						{["a", "b", "c"].map((id) => (
							<Card key={id}>
								<CardHeader className="flex flex-row items-start justify-between pb-2">
									<Skeleton className="h-5 w-40" />
									<Skeleton className="h-5 w-16 rounded-full" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-4 w-3/4" />
								</CardContent>
							</Card>
						))}
					</div>
				) : isError ? (
					<Card>
						<CardContent className="py-12 text-center text-muted-foreground">
							Failed to load projects. Please try again.
						</CardContent>
					</Card>
				) : data?.data.length ? (
					<div className="grid gap-4">
						{data.data.map((project) => (
							<Link
								key={project.id}
								to="/projects/$projectId"
								params={{ projectId: project.id }}
								className="block"
							>
								<Card className="transition-colors hover:bg-accent/50">
									<CardHeader className="flex flex-row items-start justify-between pb-2">
										<CardTitle className="text-lg">{project.name}</CardTitle>
										<Badge
											variant={
												project.role === "owner" ? "default" : "secondary"
											}
										>
											{project.role}
										</Badge>
									</CardHeader>
									{project.description && (
										<CardContent>
											<p className="line-clamp-2 text-muted-foreground text-sm">
												{project.description}
											</p>
										</CardContent>
									)}
								</Card>
							</Link>
						))}
					</div>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center gap-4 py-12">
							<FolderPlus className="size-12 text-muted-foreground" />
							<div className="text-center">
								<p className="font-medium">No projects yet</p>
								<p className="text-muted-foreground text-sm">
									Create your first project to get started.
								</p>
							</div>
							<Button asChild>
								<Link to="/projects/new">
									<Plus className="mr-2 size-4" />
									New Project
								</Link>
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
