export default function SectionHeading({
	overline,
	title,
	subtitle,
}: {
	overline?: string;
	title: string;
	subtitle?: string;
}) {
	return (
		<div className="mx-auto max-w-5xl px-4">
			{overline ? (
				<p
					className="text-xs tracking-wider uppercase text-muted-foreground mb-3"
					id={overline.toLowerCase()}
				>
					{overline}
				</p>
			) : null}
			<h2 className="text-5xl md:text-6xl font-semibold leading-tight">{title}</h2>
			{subtitle ? (
				<p className="mt-3 text-muted-foreground max-w-2xl">{subtitle}</p>
			) : null}
		</div>
	);
}


