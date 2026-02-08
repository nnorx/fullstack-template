import { loginSchema } from "@fullstack-template/shared";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		const result = loginSchema.safeParse({ email, password });
		if (!result.success) {
			setError(result.error.issues[0]?.message ?? "Invalid input");
			return;
		}

		setLoading(true);
		try {
			const { error: authError } = await signIn.email({
				email: result.data.email,
				password: result.data.password,
			});

			if (authError) {
				setError(authError.message ?? "Sign in failed");
			} else {
				await navigate({ to: "/dashboard" });
			}
		} catch {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="w-full max-w-sm space-y-6">
				<div className="text-center">
					<h1 className="font-bold text-2xl">Welcome back</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Sign in to your account
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="email" className="font-medium text-sm">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							required
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="font-medium text-sm">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							required
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Signing in..." : "Sign In"}
					</Button>
				</form>

				<p className="text-center text-muted-foreground text-sm">
					Don&apos;t have an account?{" "}
					<Link
						to="/register"
						className="text-primary underline-offset-4 hover:underline"
					>
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
