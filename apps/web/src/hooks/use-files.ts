import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useFiles(projectId: string, page = 1) {
	return useQuery({
		queryKey: queryKeys.files.list(projectId, page),
		queryFn: async () => {
			const { data } = await client.GET("/api/projects/{projectId}/files", {
				params: { path: { projectId }, query: { page } },
			});
			return data;
		},
		enabled: !!projectId,
	});
}

export function useUploadFile(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(`/api/projects/${projectId}/files`, {
				method: "POST",
				body: formData,
				credentials: "include",
			});

			if (!response.ok) {
				const err = await response.json();
				throw new Error(
					(err as { error?: { message?: string } })?.error?.message ??
						"Upload failed",
				);
			}

			return response.json();
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: [...queryKeys.files.all, "list", projectId],
			});
		},
	});
}

export function useDeleteFile(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (fileId: string) => {
			await client.DELETE("/api/projects/{projectId}/files/{fileId}", {
				params: { path: { projectId, fileId } },
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: [...queryKeys.files.all, "list", projectId],
			});
		},
	});
}

export function getFileDownloadUrl(fileId: string): string {
	return `/api/files/${fileId}/download`;
}
