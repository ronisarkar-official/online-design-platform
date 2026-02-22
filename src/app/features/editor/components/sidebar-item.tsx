import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarItemProps {
	icon: LucideIcon;
	label: string;
	isActive?: boolean;
	onClick?: () => void;
}

export const SidebarItem = ({
	icon: Icon,
	label,
	isActive,
	onClick,
}: SidebarItemProps) => {
	return (
		<TooltipProvider delayDuration={150}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						className={cn(
							'h-16 w-16 mx-auto aspect-square p-2 py-3 flex flex-col rounded-2xl justify-center items-center transition-all duration-200 ease-out',
							isActive 
								? 'bg-primary/10 text-primary scale-[0.98] shadow-inner' 
								: 'text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:scale-[1.02]',
						)}
						onClick={onClick}>
						<Icon className="size-5 shrink-0 stroke-2" />
						<span className="text-[10px] mt-1 font-medium">{label}</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="right" sideOffset={10} className="font-medium">
					{label}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
