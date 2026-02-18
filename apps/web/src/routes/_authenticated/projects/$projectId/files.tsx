import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
	getFileDownloadUrl,
	useDeleteFile,
	useFiles,
	useUploadFile,
} from "@/hooks/use-files";
import { useProject } from "@/hooks/use-projects";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectId/files",
)({
	component: ProjectFilesPage,
});

function ProjectFilesPage() {
	const { projectId } = Route.useParams();
	const { data: session } = useSession();
	const { data: project } = useProject(projectId);
	const { data, isPending } = useFiles(projectId);
	const uploadFile = useUploadFile(projectId);
	const deleteFile = useDeleteFile(projectId);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState("");

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setError("");
		uploadFile.mutate(file, {
			onError: (err) => setError(err.message),
		});

		// Reset so the same file can be selected again
		e.target.value = "";
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Files</h2>
				<div>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
						onChange={handleFileChange}
						className="hidden"
					/>
					<Button
						size="sm"
						onClick={() => fileInputRef.current?.click()}
						disabled={uploadFile.isPending}
					>
						<Upload className="mr-2 size-4" />
						{uploadFile.isPending ? "Uploading..." : "Upload Image"}
					</Button>
				</div>
			</div>

			{error && (
				<p role="alert" className="text-destructive text-sm">
					{error}
				</p>
			)}

			{isPending ? (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			) : data?.data.length ? (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{data.data.map((file) => {
						const isUploader = session?.user?.id === file.uploaderId;
						const isOwner = project?.role === "owner";
						const canDelete = isUploader || isOwner;

						return (
							<div
								key={file.id}
								className="group relative overflow-hidden rounded-lg border"
							>
								<a
									href={getFileDownloadUrl(file.id)}
									target="_blank"
									rel="noreferrer"
								>
									<img
										src={getFileDownloadUrl(file.id)}
										alt={file.filename}
										className="aspect-square w-full object-cover"
									/>
								</a>
								<div className="p-2">
									<p className="truncate font-medium text-xs">
										{file.filename}
									</p>
									<p className="text-muted-foreground text-xs">
										{file.uploaderName}
									</p>
								</div>
								{canDelete && (
									<Button
										variant="destructive"
										size="icon"
										className="absolute top-1 right-1 size-6 opacity-0 transition-opacity group-hover:opacity-100"
										onClick={() => deleteFile.mutate(file.id)}
										disabled={deleteFile.isPending}
									>
										<Trash2 className="size-3" />
									</Button>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-12">
						<ImageIcon className="size-12 text-muted-foreground" />
						<div className="text-center">
							<p className="font-medium">No files yet</p>
							<p className="text-muted-foreground text-sm">
								Upload images to share with the team.
							</p>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
