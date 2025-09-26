import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function SectionHeading({ overline, title, subtitle }: { overline?: string; title: string; subtitle?: string }) {
	return (
		<div className="mx-auto max-w-5xl px-4">
			{overline ? (
				<p className="text-xs tracking-wider uppercase text-muted-foreground mb-3" id={overline.toLowerCase()}>
					{overline}
				</p>
			) : null}
			<h2 className="text-5xl md:text-6xl font-semibold leading-tight">{title}</h2>
			{subtitle ? <p className="mt-3 text-muted-foreground max-w-2xl">{subtitle}</p> : null}
		</div>
	);
}

function HomeComponent() {
	return (
		<main className="min-h-[200vh] bg-white text-foreground">
			{/* Hero */}
			<section className="pt-10 md:pt-16">
				<div className="mx-auto max-w-6xl px-4">
					<div className="flex items-start justify-between gap-6">
						<h1 className="text-[9vw] md:text-[96px] leading-none tracking-tight font-medium">
							Browse everything.
						</h1>
						<div className="hidden md:block pt-4">
							<Button size="lg" className="rounded-full px-6">Learn More ↗</Button>
						</div>
					</div>
					<div className="mt-8 md:mt-12 rounded-[28px] border overflow-hidden">
						{/* Placeholder for hero image area */}
						<div className="aspect-[16/9] bg-muted" />
					</div>
					<div className="mt-10 grid grid-cols-2 md:grid-cols-6 gap-8 items-center text-muted-foreground">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="h-6 rounded bg-muted" />
						))}
					</div>
				</div>
			</section>

			{/* Benefits intro */}
			<section id="benefits" className="py-16 md:py-24 border-t">
				<SectionHeading
					overline="Benefits"
					title="We’ve cracked the code."
					subtitle="Sozi provides real insights, without the data overload."
				/>
				<div className="mx-auto max-w-6xl px-4 mt-10 grid grid-cols-1 md:grid-cols-4 gap-8">
					{[
						"Amplify Insights",
						"Control Your Global Presence",
						"Remove Language Barriers",
						"Visualize Growth",
					].map((t, i) => (
						<div key={i} className="space-y-2">
							<div className="h-6 w-6 rounded bg-muted" />
							<h3 className="font-medium">{t}</h3>
							<p className="text-sm text-muted-foreground">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae.
							</p>
						</div>
					))}
				</div>
				<div className="mx-auto max-w-6xl px-4 mt-10 rounded-[28px] overflow-hidden border">
					<div className="aspect-[16/9] bg-muted" />
				</div>
			</section>

			{/* Big Picture list + image */}
			<section className="py-16 md:py-24 border-t">
				<div className="mx-auto max-w-6xl px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
					<div>
						<h3 className="text-5xl md:text-6xl font-semibold">See the Big Picture</h3>
						<p className="mt-4 text-muted-foreground max-w-prose">
							Sozi turns your data into clear, vibrant visuals that show you exactly what's happening in each chapter and topic.
						</p>
						<div className="mt-8 divide-y">
							{[
								"Spot trends in seconds: No more digging through numbers.",
								"Get everyone on the same page: Share easy-to-understand reports with your team.",
								"Make presentations pop: Interactive maps and dashboards keep your audience engaged.",
								"Your global snapshot: Get a quick, clear overview of your entire operation.",
							].map((t, i) => (
								<div key={i} className="py-4 flex gap-6">
									<span className="text-sm tabular-nums w-8">{String(i + 1).padStart(2, "0")}</span>
									<p className="text-sm leading-6">{t}</p>
								</div>
							))}
						</div>
						<div className="mt-8">
							<Button className="rounded-full px-6">Discover More</Button>
						</div>
					</div>
					<div className="rounded-[28px] overflow-hidden border">
						<div className="aspect-[4/5] md:aspect-[16/12] bg-muted" />
					</div>
				</div>
			</section>

			{/* Specs comparison */}
			<section id="specs" className="py-16 md:py-24 border-t">
				<SectionHeading
					overline="Specs"
					title="Why Choose Sozi?"
					subtitle="You need a solution that keeps up. That’s why we built Sozi for students to learn faster."
				/>
				<div className="mx-auto max-w-6xl px-4 mt-12 overflow-hidden rounded-[20px] border">
					<div className="grid grid-cols-1 md:grid-cols-3">
						{["Sozi", "WebSurge", "HyperView"].map((name, idx) => (
							<div key={name} className="p-6 md:p-8 border-t md:border-t-0 md:border-l first:md:border-l-0">
								<h4 className="font-medium mb-6 opacity-80">{name}</h4>
								<ul className="space-y-4 text-sm">
									{[...Array(6)].map((_, i) => (
										<li key={i} className="flex items-center gap-3">
											<div className={`size-5 rounded-full ${idx === 0 ? "bg-primary/15" : i % 2 ? "bg-muted" : "bg-muted"} flex items-center justify-center`}></div>
											<span>Feature placeholder</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Testimonial */}
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

			{/* How-to steps */}
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

			{/* Call to action + Footer */}
			<section id="contact" className="py-20 border-t">
				<div className="mx-auto max-w-4xl px-4 text-center">
					<h3 className="text-5xl md:text-6xl font-semibold">Connect with us</h3>
					<p className="mt-3 text-muted-foreground">
						Schedule a quick call to learn how Sozi can turn your study material into a powerful advantage.
					</p>
					<div className="mt-8">
						<Button size="lg" className="rounded-full px-10 h-12 text-base">Learn More ↗</Button>
					</div>
				</div>
			</section>

			<footer className="border-t py-8">
				<div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
					<nav className="flex gap-6 text-sm">
						<a href="#benefits">Benefits</a>
						<a href="#specs">Specifications</a>
						<a href="#howto">How-to</a>
					</nav>
					<div className="text-xs text-muted-foreground">© Sozi. 2025 · All Rights Reserved</div>
				</div>
			</footer>
		</main>
	);
}
