import { ChevronLeft, ChevronsLeft } from 'lucide-react';

interface ToolSidebarCloseProps {
	onClick: () => void;
}

export const ToolSidebarClose = ({ onClick }: ToolSidebarCloseProps) => {
	return (
		<button
			onClick={onClick}
			className="absolute -right-[1.60rem] top-1/2 z-50 h-[70px] bg-background transform -translate-y-1/2 flex items-center justify-center rounded-r-xl px-1 py-2 border-r border-y group">
			<ChevronsLeft className="size-4 text-foreground group-hover:opacity-75 transition" />
		</button>
	);
};
