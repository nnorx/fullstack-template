import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function usePosts(projectId: string, page = 1) {
	return useQuery({
		queryKey: queryKeys.posts.list(projectId, page),
		queryFn: async () => {
			const { data } = await client.GET("/api/projects/{projectId}/posts", {
				params: { path: { projectId }, query: { page } },
			});
			return data;
		},
		enabled: !!projectId,
	});
}

export function usePost(projectId: string, postId: string) {
	return useQuery({
		queryKey: queryKeys.posts.detail(projectId, postId),
		queryFn: async () => {
			const { data } = await client.GET(
				"/api/projects/{projectId}/posts/{postId}",
				{
					params: { path: { projectId, postId } },
				},
			);
			return data;
		},
		enabled: !!projectId && !!postId,
	});
}

export function useCreatePost(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: { title: string; content: string }) => {
			const { data } = await client.POST("/api/projects/{projectId}/posts", {
				params: { path: { projectId } },
				body,
			});
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.posts.lists(projectId),
			});
		},
	});
}

export function useDeletePost(projectId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (postId: string) => {
			await client.DELETE("/api/projects/{projectId}/posts/{postId}", {
				params: { path: { projectId, postId } },
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.posts.lists(projectId),
			});
		},
	});
}
