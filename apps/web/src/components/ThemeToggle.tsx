import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTheme, setTheme } from "@/lib/theme";

type Theme = "light" | "dark" | "system";

const themeIcons = {
	light: Sun,
	dark: Moon,
	system: Monitor,
} as const;

export function ThemeToggle() {
	const [theme, setThemeState] = useState<Theme>(getTheme);

	const handleChange = (value: string) => {
		const newTheme = value as Theme;
		setTheme(newTheme);
		setThemeState(newTheme);
	};

	const ThemeIcon = themeIcons[theme];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" aria-label="Toggle theme">
					<ThemeIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuRadioGroup value={theme} onValueChange={handleChange}>
					<DropdownMenuRadioItem value="light">
						<Sun />
						Light
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="dark">
						<Moon />
						Dark
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value="system">
						<Monitor />
						System
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
