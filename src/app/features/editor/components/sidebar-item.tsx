import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
		<Button
			variant="ghost"
			className={cn(
				'h-fit w-full aspect-square p-2 py-3 flex flex-col rounded-none justify-center items-center',
				isActive && 'bg-muted text-primary',
			)}
			onClick={onClick}>
			<Icon className="size-5 shrink-0 stroke-2" />
			<span className=" text-xs">{label}</span>
		</Button>
	);
};
