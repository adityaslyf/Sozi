import SectionHeading from "./section-heading";

export default function Specs() {
	return (
		<section id="specs" className="py-16 md:py-24 border-t">
			<SectionHeading
				overline="Specs"
				title="Why Choose Sozi?"
				subtitle="You need a solution that keeps up. That’s why we built Sozi for students to learn faster."
			/>
			<div className="mx-auto max-w-6xl px-4 mt-12 overflow-hidden rounded-[20px] border">
				<div className="grid grid-cols-1 md:grid-cols-3">
					{["Sozi", "WebSurge", "HyperView"].map((name, idx) => (
						<div key={name} className="p-6 md:p-8 border-t md:border-t-0 md:border-l first:md:border-l-0">
							<h4 className="font-medium mb-6 opacity-80">{name}</h4>
							<ul className="space-y-4 text-sm">
								{[...Array(6)].map((_, i) => (
									<li key={i} className="flex items-center gap-3">
										<div className={`size-5 rounded-full ${idx === 0 ? "bg-primary/15" : i % 2 ? "bg-muted" : "bg-muted"} flex items-center justify-center`}></div>
										<span>Feature placeholder</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}


