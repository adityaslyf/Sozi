import { Button } from "@/components/ui/button";

export default function BigPicture() {
	return (
		<section className="py-16 md:py-24 border-t">
			<div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
				<div>
					<h3 className="text-5xl md:text-6xl font-semibold">See the big picture</h3>
					<p className="mt-4 text-muted-foreground max-w-prose">
						Sozi turns your data into clear, vibrant visuals that show you exactly what's happening in each chapter and topic.
					</p>
					<div className="mt-8 divide-y">
						{[
							"Spot what matters: auto‑highlighted key concepts and definitions.",
							"Master faster: condensed takeaways for every chapter or section.",
							"Retain more: spaced‑repetition flashcards built from your files.",
							"Always grounded: answers link back to the exact source lines.",
						].map((t, i) => (
							<div key={i} className="py-4 flex gap-6">
								<span className="text-sm tabular-nums w-8">{String(i + 1).padStart(2, "0")}</span>
								<p className="text-sm leading-6">{t}</p>
							</div>
						))}
					</div>
					<div className="mt-8">
						<Button variant="outline" className="rounded-full px-6">Explore features</Button>
					</div>
				</div>
				<div className="rounded-[28px] overflow-hidden border">
					<div className="aspect-[4/5] md:aspect-[16/12] bg-muted" />
				</div>
			</div>
		</section>
	);
}


