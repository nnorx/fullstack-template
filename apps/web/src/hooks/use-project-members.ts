import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useProjectMembers(projectId: string) {
	return useQuery({
		queryKey: queryKeys.projectMembers.list(projectId),
		queryFn: async () => {
			const { data } = await client.GET("/api/projects/{projectId}/members", {
				params: { path: { projectId } },
			});
			return data;
		},
		enabled: !!projectId,
	});
}

export function useShareProject(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (email: string) => {
			const { data } = await client.POST("/api/projects/{projectId}/members", {
				params: { path: { projectId } },
				body: { email },
			});
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.projectMembers.list(projectId),
			});
		},
	});
}

export function useRemoveMember(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (memberId: string) => {
			await client.DELETE("/api/projects/{projectId}/members/{memberId}", {
				params: { path: { projectId, memberId } },
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.projectMembers.list(projectId),
			});
		},
	});
}
