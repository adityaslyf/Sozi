export default function HowTo() {
	return (
		<section id="howto" className="py-16 md:py-24 border-t">
			<div className="mx-auto max-w-6xl px-4">
				<h3 className="text-5xl md:text-6xl font-semibold">Map Your Success</h3>
				<div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
					{[
						{ n: "01", t: "Get Started", d: "Upload PDFs and notes. You're up and running in minutes." },
						{ n: "02", t: "Customize and Configure", d: "Pick chapters, languages, and difficulty levels." },
						{ n: "03", t: "Grow Your Knowledge", d: "Review with summaries, quizzes, and flashcards." },
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


