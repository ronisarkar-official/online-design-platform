import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { IconType } from 'react-icons';
import { cn } from '@/lib/utils';

interface ShapeToolProps {
	icon: LucideIcon | IconType;
	onClick: () => void;
	iconClassName?: string;
}

export const ShapeTool = React.memo(({
	icon: Icon,
	onClick,
	iconClassName,
}: ShapeToolProps) => {
	return (
		<button
			onClick={onClick}
			className=" aspect-square border rounded-md p-5">
			<Icon className={cn('w-full h-full', iconClassName)} />
		</button>
	);
});

ShapeTool.displayName = 'ShapeTool';
