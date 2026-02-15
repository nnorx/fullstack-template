import { LoaderCircle } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Spinner({
	className,
	...props
}: React.ComponentProps<typeof LoaderCircle>) {
	return (
		<LoaderCircle
			data-slot="spinner"
			className={cn("size-4 animate-spin", className)}
			aria-hidden="true"
			{...props}
		/>
	);
}

/**
 * @public
 */
export { Spinner };
