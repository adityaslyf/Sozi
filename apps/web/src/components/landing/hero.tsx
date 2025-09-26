export default function Hero() {
	return (
		<section className="pt-10 md:pt-16">
			<div className="mx-auto max-w-6xl px-4">
				<div className="flex items-start justify-between gap-6">
					<h1 className="text-[9vw] md:text-[96px] leading-none tracking-tight font-medium">
						Your AI Study Buddy.
					</h1>
				</div>
				<div className="mt-8 md:mt-12 rounded-[28px] border overflow-hidden">
					<div className="aspect-[16/9] bg-muted" />
				</div>
				<div className="mt-6 text-lg text-muted-foreground max-w-3xl">
					Turn PDFs, notes, and textbooks into summaries, flashcards, quizzes, and a chat that cites your sources.
				</div>
				<div className="mt-10 grid grid-cols-2 md:grid-cols-6 gap-8 items-center text-muted-foreground">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-6 rounded bg-muted" />
					))}
				</div>
			</div>
		</section>
	);
}


