import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export interface HintProps {
	children: React.ReactNode;
	label: string;
	side?: 'top' | 'right' | 'bottom' | 'left';
	align?: 'start' | 'center' | 'end';
	sideOffset?: number;
	alignOffset?: number;
}

export const Hint = ({
	children,
	label,
	side,
	align,
	sideOffset,
	alignOffset,
}: HintProps) => {
	return (
		<TooltipProvider>
			<Tooltip delayDuration={100}>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent
					side={side}
					align={align}
					sideOffset={sideOffset}
					alignOffset={alignOffset}
					className="text-white bg-slate-800 border-slate-800">
					<p className="font-semibold capitalize">{label}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
