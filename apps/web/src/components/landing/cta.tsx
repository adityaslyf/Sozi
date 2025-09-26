import { Button } from "@/components/ui/button";

export default function CTA() {
	return (
		<section id="contact" className="py-20 border-t">
			<div className="mx-auto max-w-4xl px-4 text-center">
				<h3 className="text-5xl md:text-6xl font-semibold">Get started for free</h3>
				<p className="mt-3 text-muted-foreground">
					Explore Sozi now. Upload a file and see summaries, flashcards, and quizzes in seconds.
				</p>
				<div className="mt-8">
					<Button size="lg" className="rounded-full px-10 h-12 text-base">Try it — it’s free</Button>
				</div>
			</div>
		</section>
	);
}


