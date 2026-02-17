import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Plus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost, usePosts } from "@/hooks/use-posts";

export const Route = createFileRoute("/_authenticated/projects/$projectId/")({
	component: ProjectPostsPage,
});

function ProjectPostsPage() {
	const { projectId } = Route.useParams();
	const { data, isPending } = usePosts(projectId);
	const [showForm, setShowForm] = useState(false);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Posts</h2>
				<Button size="sm" onClick={() => setShowForm(!showForm)}>
					<Plus className="mr-2 size-4" />
					New Post
				</Button>
			</div>

			{showForm && (
				<CreatePostForm
					projectId={projectId}
					onDone={() => setShowForm(false)}
				/>
			)}

			{isPending ? (
				<div className="flex justify-center py-8">
					<Spinner />
				</div>
			) : data?.data.length ? (
				<div className="grid gap-3">
					{data.data.map((post) => (
						<Link
							key={post.id}
							to="/projects/$projectId/posts/$postId"
							params={{ projectId, postId: post.id }}
							className="block"
						>
							<Card className="transition-colors hover:bg-accent/50">
								<CardHeader className="pb-2">
									<CardTitle className="text-base">{post.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="line-clamp-2 text-muted-foreground text-sm">
										{post.content}
									</p>
									<div className="mt-3 flex items-center gap-4 text-muted-foreground text-xs">
										<span>By {post.authorName}</span>
										<span className="flex items-center gap-1">
											<MessageSquare className="size-3" />
											{post.commentCount}
										</span>
										<span>{new Date(post.createdAt).toLocaleDateString()}</span>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			) : (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground">
						No posts yet. Create the first one!
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function CreatePostForm({
	projectId,
	onDone,
}: {
	projectId: string;
	onDone: () => void;
}) {
	const createPost = useCreatePost(projectId);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		createPost.mutate(
			{ title, content },
			{
				onSuccess: () => {
					setTitle("");
					setContent("");
					onDone();
				},
			},
		);
	};

	return (
		<Card>
			<CardContent className="pt-6">
				<form onSubmit={handleSubmit} className="space-y-3">
					<div className="space-y-2">
						<Label htmlFor="post-title">Title</Label>
						<Input
							id="post-title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Post title"
							required
							maxLength={300}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="post-content">Content</Label>
						<Textarea
							id="post-content"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							placeholder="Write your post..."
							required
							maxLength={50000}
							rows={4}
						/>
					</div>
					<div className="flex gap-2">
						<Button
							type="submit"
							size="sm"
							disabled={
								!title.trim() || !content.trim() || createPost.isPending
							}
						>
							{createPost.isPending ? "Posting..." : "Post"}
						</Button>
						<Button type="button" variant="outline" size="sm" onClick={onDone}>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
