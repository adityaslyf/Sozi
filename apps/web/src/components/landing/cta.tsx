import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import { googleAuth } from "@/lib/google-auth";
import { toast } from "sonner";

export default function CTA() {
	const handleGoogleSignup = async () => {
		// Trigger Google signup
		try {
			await googleAuth.signInWithPopup();
		} catch (error) {
			console.error("Google signup failed:", error);
			toast.error("Google sign-up failed. Please try again.");
		}
	};

	return (
		<section id="contact" className="py-20 border-t">
			<div className="mx-auto max-w-4xl px-4 text-center">
				<h3 className="text-5xl md:text-6xl font-semibold">Get started for free</h3>
				<p className="mt-3 text-muted-foreground">
					Explore Sozi now. Upload a file and see summaries, flashcards, and quizzes in seconds.
				</p>
				<div className="mt-8">
					<Button size="lg" className="rounded-full px-10 h-12 text-base bg-primary hover:bg-primary/90 text-white" onClick={handleGoogleSignup}>
						<Chrome className="w-5 h-5 mr-2" />
						Sign up with Google
					</Button>
				</div>
			</div>
		</section>
	);
}


