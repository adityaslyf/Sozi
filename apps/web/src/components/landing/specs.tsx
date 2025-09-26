import SectionHeading from "./section-heading";

export default function Specs() {
	return (
		<section id="specs" className="py-16 md:py-24 border-t">
			<SectionHeading
				overline="Specs"
				title="Why choose Sozi?"
				subtitle="Everything you need for exams in one place — uploads, notes, flashcards, quizzes, and a grounded AI chat."
			/>
			<div className="mx-auto max-w-6xl px-4 mt-12 overflow-hidden rounded-[20px] border">
				<div className="grid grid-cols-1 md:grid-cols-3">
					{["Sozi", "Basic flashcard app", "Generic chatbot"].map((name, idx) => (
						<div key={name} className="p-6 md:p-8 border-t md:border-t-0 md:border-l first:md:border-l-0">
							<h4 className="font-medium mb-6 opacity-80">{name}</h4>
							<ul className="space-y-4 text-sm">
								{[
									"Grounded answers with citations",
									"Auto summaries & chapter notes",
									"Flashcards with spaced repetition",
									"Adaptive quizzes (MCQ, T/F, short)",
									"Large PDF support & fast uploads",
									"Progress tracking & insights",
								].map((feature, i) => (
									<li key={i} className="flex items-center gap-3">
										<div className={`size-5 rounded-full ${idx === 0 ? "bg-primary/15" : "bg-muted"}`}></div>
										<span>{feature}</span>
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


