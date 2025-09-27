import { createFileRoute } from "@tanstack/react-router";
import Hero from "@/components/landing/hero";
import Benefits from "@/components/landing/benefits";
import BigPicture from "@/components/landing/big-picture";
import Specs from "@/components/landing/specs";
import Testimonial from "@/components/landing/testimonial";
import HowTo from "@/components/landing/how-to";
import CTA from "@/components/landing/cta";
import LandingFooter from "@/components/landing/footer";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<main className="min-h-[200vh] bg-white text-foreground">
			<Hero />
			<Benefits />
			<BigPicture />
			<Specs />
			<Testimonial />
			<HowTo />
			<CTA />
			<LandingFooter />
		</main>
	);
}
