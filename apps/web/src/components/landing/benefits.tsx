import SectionHeading from "./section-heading";

export default function Benefits() {
	return (
		<section id="benefits" className="py-16 md:py-24 border-t">
			<SectionHeading
				overline="Benefits"
				title="We’ve cracked the code."
				subtitle="Sozi provides real insights, without the data overload."
			/>
			<div className="mx-auto max-w-6xl px-4 mt-10 grid grid-cols-1 md:grid-cols-4 gap-8">
				{[
					"Amplify Insights",
					"Control Your Global Presence",
					"Remove Language Barriers",
					"Visualize Growth",
				].map((t, i) => (
					<div key={i} className="space-y-2">
						<div className="h-6 w-6 rounded bg-muted" />
						<h3 className="font-medium">{t}</h3>
						<p className="text-sm text-muted-foreground">
							Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae.
						</p>
					</div>
				))}
			</div>
			<div className="mx-auto max-w-6xl px-4 mt-10 rounded-[28px] overflow-hidden border">
				<div className="aspect-[16/9] bg-muted" />
			</div>
		</section>
	);
}


