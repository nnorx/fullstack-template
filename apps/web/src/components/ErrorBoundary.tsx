import { Component, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
					<h1 className="font-semibold text-2xl text-destructive">
						Something went wrong
					</h1>
					<p className="max-w-md text-muted-foreground">
						An unexpected error occurred. Please refresh the page to try again.
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Refresh Page
					</button>
					{import.meta.env.DEV && this.state.error && (
						<pre className="mt-4 max-w-2xl overflow-auto rounded-lg bg-muted p-4 text-left text-muted-foreground text-sm">
							{this.state.error.message}
							{"\n\n"}
							{this.state.error.stack}
						</pre>
					)}
				</div>
			);
		}

		return this.props.children;
	}
}
