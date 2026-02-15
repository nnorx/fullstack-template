import { registerSchema } from "@fullstack-template/shared";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { signUp } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/_unauthenticated/register")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
		if (typeof search.redirect === "string")
			return { redirect: search.redirect };
		return {};
	},
	component: RegisterPage,
});

function RegisterPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { redirect } = Route.useSearch();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setFieldErrors({});

		const result = registerSchema.safeParse({ name, email, password });
		if (!result.success) {
			const flat = result.error.flatten();
			setFieldErrors({
				name: flat.fieldErrors.name?.[0] ?? "",
				email: flat.fieldErrors.email?.[0] ?? "",
				password: flat.fieldErrors.password?.[0] ?? "",
			});
			return;
		}

		setLoading(true);
		try {
			const { error: authError } = await signUp.email({
				name: result.data.name,
				email: result.data.email,
				password: result.data.password,
			});

			if (authError) {
				setError(authError.message ?? "Sign up failed");
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
					<h1 className="font-bold text-2xl">Create an account</h1>
					<p className="mt-1 text-muted-foreground text-sm">
						Get started with your new account
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="name" className="font-medium text-sm">
							Name
						</label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							required
							aria-invalid={!!fieldErrors.name}
						/>
						{fieldErrors.name && (
							<p className="text-destructive text-sm">{fieldErrors.name}</p>
						)}
					</div>

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
							placeholder="At least 8 characters"
							required
							aria-invalid={!!fieldErrors.password}
						/>
						{fieldErrors.password && (
							<p className="text-destructive text-sm">{fieldErrors.password}</p>
						)}
					</div>

					<Button type="submit" className="w-full" disabled={loading}>
						{loading && <Spinner />}
						{loading ? "Creating account..." : "Create Account"}
					</Button>
				</form>

				<p className="text-center text-muted-foreground text-sm">
					Already have an account?{" "}
					<Link
						to="/login"
						search={redirect ? { redirect } : {}}
						className="text-primary underline-offset-4 hover:underline"
					>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
