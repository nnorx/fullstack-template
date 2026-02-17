import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useCreateComment(projectId: string, postId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (content: string) => {
			const { data } = await client.POST(
				"/api/projects/{projectId}/posts/{postId}/comments",
				{
					params: { path: { projectId, postId } },
					body: { content },
				},
			);
			return data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.posts.detail(projectId, postId),
			});
			void queryClient.invalidateQueries({
				queryKey: [...queryKeys.posts.all, "list", projectId],
			});
		},
	});
}

export function useDeleteComment(projectId: string, postId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (commentId: string) => {
			await client.DELETE(
				"/api/projects/{projectId}/posts/{postId}/comments/{commentId}",
				{
					params: { path: { projectId, postId, commentId } },
				},
			);
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.posts.detail(projectId, postId),
			});
			void queryClient.invalidateQueries({
				queryKey: [...queryKeys.posts.all, "list", projectId],
			});
		},
	});
}
