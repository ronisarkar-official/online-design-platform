interface ToolSidebarHeaderProps {
	title: string;
	description?: string;
}

export const ToolSidebarHeader = ({
	title,
	description,
}: ToolSidebarHeaderProps) => {
	return (
		<div className="flex items-center justify-between p-4 border-b space-y-1 h-[68px] ">
			<h2 className="text-sm font-semibold">{title}</h2>

			{description && (
				<p className="text-xs text-muted-foreground">{description}</p>
			)}
		</div>
	);
};
