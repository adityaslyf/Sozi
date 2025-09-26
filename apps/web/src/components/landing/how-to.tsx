export default function HowTo() {
	return (
		<section id="howto" className="py-16 md:py-24 border-t">
			<div className="mx-auto max-w-6xl px-4">
				<h3 className="text-5xl md:text-6xl font-semibold">Map Your Success</h3>
				<div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
				{[
					{ n: "01", t: "Upload your material", d: "PDFs, slides, and notes — Sozi processes large files quickly." },
					{ n: "02", t: "Get instant study tools", d: "Auto summaries, flashcards, and quizzes tailored to your chapters." },
					{ n: "03", t: "Practice and track progress", d: "Adaptive exercises and analytics keep you focused on weak areas." },
				].map((s) => (
						<div key={s.n} className="space-y-2">
							<div className="text-5xl font-medium opacity-30">{s.n}</div>
							<h4 className="font-medium">{s.t}</h4>
							<p className="text-sm text-muted-foreground">{s.d}</p>
						</div>
					))}
				</div>
				<div className="mt-10 rounded-[28px] overflow-hidden border">
					<div className="aspect-[16/9] bg-muted" />
				</div>
			</div>
		</section>
	);
}


