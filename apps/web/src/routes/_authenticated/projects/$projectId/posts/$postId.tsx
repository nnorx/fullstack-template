import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateComment, useDeleteComment } from "@/hooks/use-comments";
import { useDeletePost, usePost } from "@/hooks/use-posts";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute(
	"/_authenticated/projects/$projectId/posts/$postId",
)({
	component: PostDetailPage,
});

function PostDetailPage() {
	const { projectId, postId } = Route.useParams();
	const navigate = useNavigate();
	const { data: session } = useSession();
	const { data: post, isPending, isError } = usePost(projectId, postId);
	const deletePost = useDeletePost(projectId);

	const handleDeletePost = () => {
		deletePost.mutate(postId, {
			onSuccess: () => {
				void navigate({
					to: "/projects/$projectId",
					params: { projectId },
				});
			},
		});
	};

	if (isPending) {
		return (
			<div className="flex justify-center py-8">
				<Spinner />
			</div>
		);
	}

	if (isError || !post) {
		return (
			<div className="text-center text-muted-foreground">Post not found</div>
		);
	}

	const isAuthor = session?.user?.id === post.authorId;

	return (
		<div className="space-y-6">
			<Link
				to="/projects/$projectId"
				params={{ projectId }}
				className="inline-flex items-center text-muted-foreground text-sm hover:text-foreground"
			>
				<ArrowLeft className="mr-1 size-4" />
				Back to posts
			</Link>

			<Card>
				<CardHeader>
					<div className="flex items-start justify-between">
						<div>
							<CardTitle>{post.title}</CardTitle>
							<p className="mt-1 text-muted-foreground text-sm">
								By {post.authorName} on{" "}
								{new Date(post.createdAt).toLocaleDateString()}
							</p>
						</div>
						{isAuthor && (
							<Button
								variant="ghost"
								size="icon"
								onClick={handleDeletePost}
								disabled={deletePost.isPending}
							>
								<Trash2 className="size-4" />
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<p className="whitespace-pre-wrap">{post.content}</p>
				</CardContent>
			</Card>

			<Separator />

			<div className="space-y-4">
				<h3 className="font-semibold">Comments ({post.comments.length})</h3>

				<CommentForm projectId={projectId} postId={postId} />

				{post.comments.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						No comments yet. Be the first to comment!
					</p>
				) : (
					<div className="space-y-3">
						{post.comments.map((comment) => (
							<CommentItem
								key={comment.id}
								comment={comment}
								projectId={projectId}
								postId={postId}
								currentUserId={session?.user?.id}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function CommentForm({
	projectId,
	postId,
}: {
	projectId: string;
	postId: string;
}) {
	const createComment = useCreateComment(projectId, postId);
	const [content, setContent] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		createComment.mutate(content, {
			onSuccess: () => setContent(""),
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex gap-2">
			<Textarea
				value={content}
				onChange={(e) => setContent(e.target.value)}
				placeholder="Write a comment..."
				maxLength={5000}
				rows={2}
				className="flex-1"
			/>
			<Button
				type="submit"
				size="sm"
				disabled={!content.trim() || createComment.isPending}
				className="self-end"
			>
				{createComment.isPending ? "..." : "Comment"}
			</Button>
		</form>
	);
}

function CommentItem({
	comment,
	projectId,
	postId,
	currentUserId,
}: {
	comment: {
		id: string;
		authorId: string;
		authorName: string;
		content: string;
		createdAt: string;
	};
	projectId: string;
	postId: string;
	currentUserId?: string | undefined;
}) {
	const deleteComment = useDeleteComment(projectId, postId);
	const isAuthor = currentUserId === comment.authorId;

	return (
		<div className="rounded-lg border p-3">
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-2 text-sm">
					<span className="font-medium">{comment.authorName}</span>
					<span className="text-muted-foreground text-xs">
						{new Date(comment.createdAt).toLocaleDateString()}
					</span>
				</div>
				{isAuthor && (
					<Button
						variant="ghost"
						size="icon"
						className="size-6"
						onClick={() => deleteComment.mutate(comment.id)}
						disabled={deleteComment.isPending}
					>
						<Trash2 className="size-3" />
					</Button>
				)}
			</div>
			<p className="mt-1 text-sm">{comment.content}</p>
		</div>
	);
}
