import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	useMarkAllAsRead,
	useMarkAsRead,
	useNotifications,
	useUnreadCount,
} from "@/hooks/use-notifications";
import { queryKeys } from "@/lib/query-keys";

export function NotificationBell() {
	const [open, setOpen] = useState(false);
	const { data: unreadData } = useUnreadCount();
	const { data: notificationsData } = useNotifications();
	const markAsRead = useMarkAsRead();
	const markAllAsRead = useMarkAllAsRead();
	const queryClient = useQueryClient();

	const unreadCount = unreadData?.count ?? 0;
	const notifications = notificationsData?.data ?? [];

	const handleMarkAllRead = () => {
		markAllAsRead.mutate(undefined, {
			onSuccess: () => {
				void queryClient.invalidateQueries({
					queryKey: queryKeys.notifications.all,
				});
			},
		});
	};

	return (
		<div className="relative">
			<Button
				variant="ghost"
				size="icon"
				className="relative"
				onClick={() => setOpen(!open)}
				aria-label="Notifications"
			>
				<Bell className="size-4" />
				{unreadCount > 0 && (
					<span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive font-medium text-[10px] text-destructive-foreground">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</Button>

			{open && (
				<>
					<button
						type="button"
						className="fixed inset-0 z-40 cursor-default"
						onClick={() => setOpen(false)}
						aria-label="Close notifications"
					/>
					<div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-lg border bg-popover shadow-lg">
						<div className="flex items-center justify-between border-b p-3">
							<span className="font-semibold text-sm">Notifications</span>
							{unreadCount > 0 && (
								<Button
									variant="ghost"
									size="sm"
									className="h-auto px-2 py-1 text-xs"
									onClick={handleMarkAllRead}
								>
									Mark all read
								</Button>
							)}
						</div>
						<div className="max-h-80 overflow-y-auto">
							{notifications.length === 0 ? (
								<p className="p-4 text-center text-muted-foreground text-sm">
									No notifications
								</p>
							) : (
								notifications.map((n) => (
									<NotificationItem
										key={n.id}
										notification={n}
										onMarkRead={(id) => {
											markAsRead.mutate(id);
										}}
										onClose={() => setOpen(false)}
									/>
								))
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

function NotificationItem({
	notification,
	onMarkRead,
	onClose,
}: {
	notification: {
		id: string;
		type: string;
		message: string;
		read: boolean;
		projectId: string | null;
		createdAt: string;
		actorName: string;
	};
	onMarkRead: (id: string) => void;
	onClose: () => void;
}) {
	const content = (
		<div
			className={`flex items-start gap-2 border-b p-3 text-sm transition-colors hover:bg-accent/50 ${
				notification.read ? "" : "bg-accent/20"
			}`}
		>
			<div className="flex-1">
				<p>{notification.message}</p>
				<p className="mt-0.5 text-muted-foreground text-xs">
					{new Date(notification.createdAt).toLocaleDateString()}
				</p>
			</div>
			{!notification.read && (
				<Button
					variant="ghost"
					size="icon"
					className="size-6 shrink-0"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onMarkRead(notification.id);
					}}
				>
					<Check className="size-3" />
				</Button>
			)}
		</div>
	);

	if (notification.projectId) {
		return (
			<Link
				to="/projects/$projectId"
				params={{ projectId: notification.projectId }}
				onClick={onClose}
			>
				{content}
			</Link>
		);
	}

	return content;
}
