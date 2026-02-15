import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { signOut, useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";

export function Navbar() {
	const queryClient = useQueryClient();
	const { data: session, isPending } = useSession();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);

	const handleSignOut = () => {
		void signOut({
			fetchOptions: {
				onSuccess: () => {
					queryClient.removeQueries({
						queryKey: queryKeys.auth.session(),
					});
					void navigate({ to: "/" });
				},
			},
		});
	};

	const isAuthenticated = !!session?.user;

	return (
		<header className="flex items-center justify-between border-border border-b px-6 py-4">
			{/* Brand + desktop nav links */}
			<nav className="flex items-center gap-6">
				<Link
					to={isAuthenticated ? "/dashboard" : "/"}
					className="font-semibold text-lg"
				>
					Fullstack Template
				</Link>
				{isAuthenticated && (
					<Link
						to="/dashboard"
						className="hidden text-muted-foreground text-sm transition-colors hover:text-foreground md:inline [&.active]:text-foreground"
					>
						Dashboard
					</Link>
				)}
			</nav>

			{/* Desktop actions */}
			<div className="hidden items-center gap-2 md:flex">
				{isPending ? null : isAuthenticated ? (
					<>
						<span className="text-muted-foreground text-sm">
							{session.user.name}
						</span>
						<Button variant="ghost" size="sm" onClick={handleSignOut}>
							Sign Out
						</Button>
					</>
				) : (
					<>
						<Button variant="ghost" size="sm" asChild>
							<Link to="/login">Sign In</Link>
						</Button>
						<Button size="sm" asChild>
							<Link to="/register">Sign Up</Link>
						</Button>
					</>
				)}
				<ThemeToggle />
			</div>

			{/* Mobile hamburger + sheet */}
			<div className="flex items-center gap-2 md:hidden">
				<ThemeToggle />
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" aria-label="Open menu">
							<Menu />
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-64">
						<SheetHeader>
							<SheetTitle>Menu</SheetTitle>
						</SheetHeader>
						<nav className="flex flex-col gap-1 px-4">
							{isAuthenticated && (
								<SheetClose asChild>
									<Link
										to="/dashboard"
										className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent [&.active]:bg-accent [&.active]:text-accent-foreground"
									>
										Dashboard
									</Link>
								</SheetClose>
							)}
						</nav>
						<div className="mt-auto border-t px-4 pt-4 pb-2">
							{isPending ? null : isAuthenticated ? (
								<div className="flex flex-col gap-3">
									<span className="truncate text-muted-foreground text-sm">
										{session.user.name}
									</span>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() => {
											setOpen(false);
											handleSignOut();
										}}
									>
										Sign Out
									</Button>
								</div>
							) : (
								<div className="flex flex-col gap-2">
									<SheetClose asChild>
										<Button size="sm" className="w-full" asChild>
											<Link to="/register">Sign Up</Link>
										</Button>
									</SheetClose>
									<SheetClose asChild>
										<Button
											variant="outline"
											size="sm"
											className="w-full"
											asChild
										>
											<Link to="/login">Sign In</Link>
										</Button>
									</SheetClose>
								</div>
							)}
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
