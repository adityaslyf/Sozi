import { createFileRoute, useParams, Link } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { googleAuth } from '@/lib/google-auth';
import AUTH_CONFIG from '@/config/auth';
import { toast } from 'sonner';
import FileUpload from '@/components/file-upload';
import FileList from '@/components/file-list';
import GoldenSummary from '@/components/golden-summary';
import { 
  WorkingFormatCard,
  CalendarCard,
  MetricCard,
  TodoListCard,
  ActivityCard,
  HeroCard
} from '@/components/dashboard';

interface Workspace {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

function WorkspaceDetail() {
	const { workspaceId } = useParams({ from: '/workspaces/$workspaceId' });
	const [workspace, setWorkspace] = useState<Workspace | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [selectedFile, setSelectedFile] = useState<{ id: string; name: string } | null>(null);
	const [activeTab, setActiveTab] = useState('overview');

	// Check if user is logged in
	const isLoggedIn = googleAuth.isLoggedIn();

	// Component initialization

	const fetchWorkspace = useCallback(async () => {
		try {
			const token = googleAuth.getAccessToken();
			
			const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setWorkspace(data.workspace);
			} else {
				console.error('Failed to fetch workspace:', data);
				toast.error('Failed to load workspace. Please try again.');
			}
		} catch (error) {
			console.error('Error fetching workspace:', error);
			toast.error('Network error. Please check your connection.');
		} finally {
			setLoading(false);
		}
	}, [workspaceId]);

	useEffect(() => {
		if (isLoggedIn && workspaceId) {
			fetchWorkspace();
		} else {
			setLoading(false);
		}
	}, [isLoggedIn, workspaceId, fetchWorkspace]);

	const handleUploadComplete = () => {
		// Trigger refresh of file list
		setRefreshTrigger(prev => prev + 1);
	};

	const handleViewSummary = (fileId: string, fileName: string) => {
		setSelectedFile({ id: fileId, name: fileName });
	};

	const handleBackToFiles = () => {
		setSelectedFile(null);
	};

	if (!isLoggedIn) {
		return (
			<div className="container mx-auto px-4 py-16 text-center">
				<h1 className="text-4xl font-bold mb-4">Access Denied</h1>
				<p className="text-gray-600 mb-8">You need to be logged in to view workspaces.</p>
				<Button asChild>
					<Link to="/">Go to Home</Link>
				</Button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-16 text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
				<p className="text-gray-600">Loading workspace...</p>
			</div>
		);
	}

	if (!workspace) {
		return (
			<div className="container mx-auto px-4 py-16 text-center">
				<h1 className="text-4xl font-bold mb-4">Workspace Not Found</h1>
				<p className="text-gray-600 mb-8">The workspace you're looking for doesn't exist or you don't have access to it.</p>
				<Button asChild>
					<Link to="/workspaces">Back to Workspaces</Link>
				</Button>
			</div>
		);
	}

	return (
		<main className="corp-theme min-h-screen lg:h-screen lg:overflow-hidden" style={{ background: "var(--corp-bg)" }}>
			<div className="grid grid-cols-12 gap-4 md:gap-6 lg:gap-8 px-3 md:px-4 lg:px-6 pt-24 pb-4 min-h-screen lg:h-full max-w-[1600px] mx-auto">
				{/* Sidebar Component */}
				<div className="hidden lg:block col-span-2 xl:col-span-2 corp-sidebar p-6 h-full overflow-y-auto">
					<div className="flex items-center gap-3 mb-8">
						<div className="corp-pill w-9 h-9 grid place-items-center text-black text-sm font-bold shadow-sm">
							{workspace.name.charAt(0).toUpperCase()}
						</div>
						<div>
							<div className="font-semibold text-sm" style={{ color: "var(--corp-text)" }}>
								{workspace.name}
							</div>
							<div className="text-xs opacity-70" style={{ color: "var(--corp-muted)" }}>
								Workspace
							</div>
						</div>
					</div>

					{/* Navigation */}
					<nav className="space-y-2">
						<div className="opacity-60 mb-4 text-xs font-medium tracking-wider" style={{ color: "var(--corp-muted)" }}>MENU</div>
						{[
							{ id: 'overview', label: 'Overview', icon: '📊' },
							{ id: 'files', label: 'Files', icon: '📁' },
							{ id: 'notes', label: 'Notes', icon: '📝' },
							{ id: 'exercises', label: 'Exercises', icon: '🏋️' },
						].map((item) => (
							<button
								key={item.id}
								onClick={() => setActiveTab(item.id)}
								className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
									activeTab === item.id
										? 'corp-nav-active shadow-sm'
										: 'corp-nav-item hover:corp-nav-hover opacity-70'
								}`}
							>
								<span className="text-base">{item.icon}</span>
								<span className="font-medium">{item.label}</span>
							</button>
						))}
					</nav>

					{/* Back to Home */}
					<div className="mt-8 pt-6 border-t border-white/10">
						<Link to="/home" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
							<ArrowLeft className="w-4 h-4" />
							Back to Home
						</Link>
					</div>
				</div>

				{/* Main Content */}
				<section className="col-span-12 lg:col-span-10 xl:col-span-10 grid xl:grid-cols-12 lg:grid-cols-12 grid-cols-1 gap-4 md:gap-6 lg:gap-8 items-start lg:h-full lg:overflow-y-auto">
					{selectedFile ? (
						/* Summary View */
						<div className="col-span-12 space-y-6">
							<div className="flex items-center gap-4 mb-6">
								<Button variant="outline" onClick={handleBackToFiles}>
									<ArrowLeft className="w-4 h-4 mr-2" />
									Back to Files
								</Button>
								<div>
									<h2 className="text-xl font-semibold">Golden Summary</h2>
									<p className="text-gray-600">{selectedFile.name}</p>
								</div>
							</div>
							<GoldenSummary 
								fileId={selectedFile.id}
								fileName={selectedFile.name}
								workspaceId={workspaceId}
							/>
						</div>
					) : (
						<>
							{/* Main Content - Dashboard Layout */}
							<div className="xl:col-span-8 lg:col-span-7 col-span-12 grid grid-cols-12 gap-4 md:gap-6 lg:h-full lg:overflow-y-auto content-start">
								
								{/* ROW 1: Hero + Working Format + Activity */}
								<div className="col-span-12 lg:col-span-4">
									<HeroCard 
										userName={workspace.name} 
										userImage={undefined}
									/>
								</div>
								<div className="col-span-12 lg:col-span-4">
									<WorkingFormatCard />
								</div>
								<div className="col-span-12 lg:col-span-4">
									<ActivityCard />
								</div>

								{/* ROW 2: File Upload + File List OR Calendar based on active tab */}
								{activeTab === 'files' && (
									<>
										<div className="col-span-12 lg:col-span-6">
											<div className="corp-glass p-6 rounded-3xl">
												<h2 className="text-xl font-semibold mb-4" style={{ color: "var(--corp-text)" }}>Upload Materials</h2>
												<FileUpload 
													workspaceId={workspaceId} 
													onUploadComplete={handleUploadComplete}
												/>
											</div>
										</div>
										<div className="col-span-12 lg:col-span-6">
											<div className="corp-glass p-6 rounded-3xl">
												<h2 className="text-xl font-semibold mb-4" style={{ color: "var(--corp-text)" }}>Study Materials</h2>
												<FileList 
													workspaceId={workspaceId} 
													refreshTrigger={refreshTrigger}
													onViewSummary={handleViewSummary}
												/>
											</div>
										</div>
									</>
								)}

								{/* ROW 2: Calendar (for overview tab) */}
								{activeTab === 'overview' && (
									<div className="col-span-12">
										<CalendarCard />
									</div>
								)}

								{/* ROW 3: Metrics Cards */}
								{activeTab === 'overview' && (
									<div className="col-span-12 grid grid-cols-4 gap-3">
										<MetricCard title="Files" value={4} />
										<MetricCard title="Notes" value={12} />
										<MetricCard title="Exercises" value={8} />
										<MetricCard title="Summaries" value={3} />
									</div>
								)}

							</div>

							{/* Right Rail - Onboarding Tasks */}
							<div className="xl:col-span-4 lg:col-span-5 col-span-12">
								<TodoListCard glass />
							</div>
						</>
					)}
				</section>
			</div>
		</main>
	);
}

export const Route = createFileRoute('/workspaces/$workspaceId')({
	component: WorkspaceDetail,
});
