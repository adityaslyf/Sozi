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
				<div className="hidden lg:flex w-20 corp-sidebar p-4 h-full overflow-y-auto flex-col">
					{/* Header */}
					<div className="flex flex-col items-center mb-6">
						<div className="corp-pill w-10 h-10 grid place-items-center text-black text-xs font-bold shadow-sm mb-2">
							{workspace.name.charAt(0).toUpperCase()}
						</div>
						<div className="font-bold text-xs text-center text-white/90">{workspace.name}</div>
					</div>

					{/* Navigation Section */}
					<div className="flex-1 space-y-6">
						{/* Overview Section */}
						<div className="flex flex-col items-center">
							<button
								onClick={() => setActiveTab('overview')}
								className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 mb-2 ${
									activeTab === 'overview'
										? 'bg-blue-500 text-white shadow-lg'
										: 'bg-white/10 text-white/70 hover:bg-white/20'
								}`}
							>
								<span className="text-lg">📊</span>
							</button>
							<span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">OVERVIEW</span>
						</div>

						{/* Files Section */}
						<div className="flex flex-col items-center">
							<button
								onClick={() => setActiveTab('files')}
								className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 mb-2 ${
									activeTab === 'files'
										? 'bg-green-500 text-white shadow-lg'
										: 'bg-white/10 text-white/70 hover:bg-white/20'
								}`}
							>
								<span className="text-lg">📁</span>
							</button>
							<span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">FILES</span>
						</div>

						{/* Notes Section */}
						<div className="flex flex-col items-center">
							<button
								onClick={() => setActiveTab('notes')}
								className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 mb-2 ${
									activeTab === 'notes'
										? 'bg-purple-500 text-white shadow-lg'
										: 'bg-white/10 text-white/70 hover:bg-white/20'
								}`}
							>
								<span className="text-lg">📝</span>
							</button>
							<span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">NOTES</span>
						</div>

						{/* Exercises Section */}
						<div className="flex flex-col items-center">
							<button
								onClick={() => setActiveTab('exercises')}
								className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 mb-2 ${
									activeTab === 'exercises'
										? 'bg-orange-500 text-white shadow-lg'
										: 'bg-white/10 text-white/70 hover:bg-white/20'
								}`}
							>
								<span className="text-lg">🏋️</span>
							</button>
							<span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">EXERCISES</span>
						</div>
					</div>

					{/* Bottom Section */}
					<div className="space-y-6">
						{/* Back to Home */}
						<div className="flex flex-col items-center pt-4 border-t border-white/10">
							<Link 
								to="/home" 
								className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 mb-2"
							>
								<ArrowLeft className="w-4 h-4" />
							</Link>
							<span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">HOME</span>
						</div>
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
