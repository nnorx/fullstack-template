import { loginSchema } from "@fullstack-template/shared";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { signIn } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/_unauthenticated/login")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
		if (typeof search.redirect === "string")
			return { redirect: search.redirect };
		return {};
	},
	component: LoginPage,
});

function LoginPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { redirect } = Route.useSearch();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setFieldErrors({});

		const result = loginSchema.safeParse({ email, password });
		if (!result.success) {
			const flat = result.error.flatten();
			setFieldErrors({
				email: flat.fieldErrors.email?.[0] ?? "",
				password: flat.fieldErrors.password?.[0] ?? "",
			});
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
				queryClient.removeQueries({
					queryKey: queryKeys.auth.session(),
				});
				await navigate({ to: redirect ?? "/dashboard" });
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
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							required
							aria-invalid={!!fieldErrors.email}
						/>
						{fieldErrors.email && (
							<p className="text-destructive text-sm">{fieldErrors.email}</p>
						)}
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="font-medium text-sm">
							Password
						</label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter your password"
							required
							aria-invalid={!!fieldErrors.password}
						/>
						{fieldErrors.password && (
							<p className="text-destructive text-sm">{fieldErrors.password}</p>
						)}
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && <Spinner />}
						{loading ? "Signing in..." : "Sign In"}
					</Button>
				</form>

				<p className="text-center text-muted-foreground text-sm">
					Don&apos;t have an account?{" "}
					<Link
						to="/register"
						search={redirect ? { redirect } : {}}
						className="text-primary underline-offset-4 hover:underline"
					>
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
