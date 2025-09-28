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
					) : activeTab === 'files' ? (
						/* Dedicated Full-Width Files Layout (restored) */
						<>
						<div className="col-span-12 p-4 space-y-4">
							{/* Hero Header - Compact */}
							<div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#243137] p-4 shadow-lg">
								<div className="absolute inset-0 bg-gradient-to-br from-[#bd9f67]/5 to-transparent" />
								<div className="relative flex flex-col gap-4">
									<div className="flex items-center justify-between gap-4">
										<div>
											<h1 className="text-xl font-bold text-white">Study Materials</h1>
											<p className="text-[#bd9f67] text-xs mt-1">Smart uploads, golden summaries, quick actions</p>
										</div>
										<div className="flex items-center gap-2">
											<button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all backdrop-blur-sm">Import</button>
											<button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#bd9f67] text-[#1a1f2e] hover:brightness-110 shadow-md transition-all">Upload Files</button>
										</div>
									</div>
									<div className="flex flex-col md:flex-row gap-2">
										<div className="relative flex-1">
											<svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
											</svg>
											<input className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#bd9f67]/50 focus:border-[#bd9f67]/50 transition backdrop-blur-sm" placeholder="Search files, titles, or dates..." />
										</div>
										<div className="flex items-center gap-1.5 flex-wrap">
											<button className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#bd9f67] text-[#1a1f2e] border border-[#bd9f67]">All</button>
											<button className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm">PDF</button>
											<button className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm">DOCX</button>
											<button className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-green-400 border border-white/20 hover:bg-white/20 backdrop-blur-sm">Ready</button>
											<button className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-[#bd9f67] border border-white/20 hover:bg-white/20 backdrop-blur-sm">Summaries</button>
										</div>
									</div>
								</div>
							</div>

							{/* Upload & File List Row */}
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
								{/* Upload Component Only */}
								<div className="scale-75 origin-top-left">
									<FileUpload 
										workspaceId={workspaceId} 
										onUploadComplete={handleUploadComplete}
									/>
								</div>

								{/* File List - Compact */}
								<div className="space-y-2">
									<div className="flex items-center justify-between bg-[#243137] rounded-xl border border-white/10 p-2.5 shadow-lg">
										<h2 className="text-white font-semibold text-sm">All Materials</h2>
										<div className="flex items-center gap-1">
											<button className="px-2 py-1 rounded-md text-xs bg-[#bd9f67] text-[#1a1f2e] border border-[#bd9f67] font-medium">Grid</button>
											<button className="px-2 py-1 rounded-md text-xs text-white hover:text-[#bd9f67] bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-sm">List</button>
										</div>
									</div>
									<div className="rounded-xl border border-white/10 bg-[#243137] overflow-hidden shadow-lg">
										<FileList 
											workspaceId={workspaceId} 
											refreshTrigger={refreshTrigger}
											onViewSummary={handleViewSummary}
										/>
									</div>
								</div>
							</div>
						</div>
						</>
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
