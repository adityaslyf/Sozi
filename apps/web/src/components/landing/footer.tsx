export default function LandingFooter() {
	return (
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
	);
}


