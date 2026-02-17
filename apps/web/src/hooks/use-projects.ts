import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useProjects(page = 1) {
	return useQuery({
		queryKey: queryKeys.projects.list(page),
		queryFn: async () => {
			const { data } = await client.GET("/api/projects", {
				params: { query: { page } },
			});
			return data;
		},
	});
}

export function useProject(projectId: string) {
	return useQuery({
		queryKey: queryKeys.projects.detail(projectId),
		queryFn: async () => {
			const { data } = await client.GET("/api/projects/{projectId}", {
				params: { path: { projectId } },
			});
			return data;
		},
		enabled: !!projectId,
	});
}

export function useCreateProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: { name: string; description?: string }) => {
			const { data } = await client.POST("/api/projects", {
				body,
			});
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.projects.all,
			});
		},
	});
}
