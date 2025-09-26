import SectionHeading from "./section-heading";

export default function Benefits() {
	return (
		<section id="benefits" className="py-16 md:py-24 border-t">
			<SectionHeading
				overline="Benefits"
				title="Study smarter, not longer."
				subtitle="Sozi turns your materials into actionable study tools — grounded answers, concise notes, smart flashcards, and adaptive quizzes."
			/>
			<div className="mx-auto max-w-6xl px-4 mt-10 grid grid-cols-1 md:grid-cols-4 gap-8">
				{[
					{
						t: "Instant summaries",
						d: "Upload PDFs and get clean, chapter‑wise notes in seconds.",
					},
					{
						t: "Smart flashcards",
						d: "Auto‑generated Q&A for spaced repetition and quick review.",
					},
					{
						t: "Adaptive quizzes",
						d: "MCQs and short answers that focus on your weak spots.",
					},
					{
						t: "Grounded AI chat",
						d: "Ask anything — responses cite the exact lines from your files.",
					},
				].map((b, i) => (
					<div key={i} className="space-y-2">
						<div className="h-6 w-6 rounded bg-muted" />
						<h3 className="font-medium">{b.t}</h3>
						<p className="text-sm text-muted-foreground">{b.d}</p>
					</div>
				))}
			</div>
			<div className="mx-auto max-w-6xl px-4 mt-10 rounded-[28px] overflow-hidden border">
				<div className="aspect-[16/9] bg-muted" />
			</div>
		</section>
	);
}


