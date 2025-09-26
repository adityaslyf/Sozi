export default function Testimonial() {
	return (
		<section className="py-16 md:py-24 border-t">
			<div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
				<div className="rounded-[28px] overflow-hidden border aspect-[3/4] md:aspect-[4/5] bg-muted" />
				<div>
					<blockquote className="text-3xl md:text-4xl leading-snug">
						“I was skeptical, but Sozi has completely transformed the way I study. The summaries are clear and the flashcards are spot-on.”
					</blockquote>
					<p className="mt-6 text-sm">
						<strong>John Smith</strong>
						<br />
						<span className="text-primary">Head of Data</span>
					</p>
				</div>
			</div>
		</section>
	);
}


