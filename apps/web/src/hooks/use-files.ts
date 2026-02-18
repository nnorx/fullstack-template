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
			const { data } = await client.POST("/api/projects/{projectId}/files", {
				params: { path: { projectId } },
				// OpenAPI codegen types binary fields as `string`; cast needed for File
				body: { file: file as unknown as string },
				bodySerializer(body) {
					const fd = new FormData();
					if (body) fd.append("file", body.file as unknown as Blob);
					return fd;
				},
			});
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.files.lists(projectId),
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
				queryKey: queryKeys.files.lists(projectId),
			});
		},
	});
}

export function getFileDownloadUrl(fileId: string): string {
	return `/api/files/${fileId}/download`;
}
