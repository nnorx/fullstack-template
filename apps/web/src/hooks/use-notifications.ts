import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { client } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
	connectWebSocket,
	disconnectWebSocket,
	onMessage,
} from "@/lib/ws-client";

export function useNotifications(page = 1) {
	return useQuery({
		queryKey: queryKeys.notifications.list(page),
		queryFn: async () => {
			const { data } = await client.GET("/api/notifications", {
				params: { query: { page } },
			});
			return data;
		},
	});
}

export function useUnreadCount() {
	return useQuery({
		queryKey: queryKeys.notifications.unreadCount(),
		queryFn: async () => {
			const { data } = await client.GET("/api/notifications/unread-count");
			return data;
		},
		refetchInterval: 30_000,
	});
}

export function useMarkAsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (notificationId: string) => {
			await client.PATCH("/api/notifications/{notificationId}/read", {
				params: { path: { notificationId } },
			});
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.all,
			});
		},
	});
}

export function useMarkAllAsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			await client.POST("/api/notifications/mark-all-read");
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeys.notifications.all,
			});
		},
	});
}

export function useWebSocketNotifications() {
	const queryClient = useQueryClient();

	useEffect(() => {
		connectWebSocket();

		const unsubscribe = onMessage((data) => {
			if (data.type === "notification") {
				void queryClient.invalidateQueries({
					queryKey: queryKeys.notifications.all,
				});

				const inner = data.data as
					| { type?: string; projectId?: string }
					| undefined;
				const projectId = inner?.projectId;
				if (projectId) {
					void queryClient.invalidateQueries({
						queryKey: [...queryKeys.posts.all, "list", projectId],
					});
					void queryClient.invalidateQueries({
						queryKey: [...queryKeys.posts.all, "detail", projectId],
					});
					void queryClient.invalidateQueries({
						queryKey: [...queryKeys.files.all, "list", projectId],
					});
					void queryClient.invalidateQueries({
						queryKey: queryKeys.projectMembers.list(projectId),
					});
				}
				if (inner?.type === "project_shared") {
					void queryClient.invalidateQueries({
						queryKey: queryKeys.projects.all,
					});
				}
			}
		});

		return () => {
			unsubscribe();
			disconnectWebSocket();
		};
	}, [queryClient]);
}
