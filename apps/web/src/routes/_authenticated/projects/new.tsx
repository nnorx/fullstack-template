import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/use-projects";

export const Route = createFileRoute("/_authenticated/projects/new")({
	component: NewProjectPage,
});

function NewProjectPage() {
	const navigate = useNavigate();
	const createProject = useCreateProject();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const body = description ? { name, description } : { name };
		createProject.mutate(body, {
			onSuccess: (data) => {
				if (data) {
					void navigate({
						to: "/projects/$projectId",
						params: { projectId: data.id },
					});
				}
			},
		});
	};

	return (
		<div className="flex flex-1 flex-col p-6">
			<div className="mx-auto w-full max-w-lg">
				<Card>
					<CardHeader>
						<CardTitle>Create Project</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="My Awesome Project"
									required
									maxLength={200}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="description">Description (optional)</Label>
								<Textarea
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="What is this project about?"
									maxLength={2000}
									rows={3}
								/>
							</div>
							<div className="flex gap-2">
								<Button
									type="submit"
									disabled={!name.trim() || createProject.isPending}
								>
									{createProject.isPending ? "Creating..." : "Create Project"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => void navigate({ to: "/projects" })}
								>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
