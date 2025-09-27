import { createFileRoute, useParams, Link } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Folder } from 'lucide-react';
import { googleAuth } from '@/lib/google-auth';
import AUTH_CONFIG from '@/config/auth';
import { toast } from 'sonner';
import FileUpload from '@/components/file-upload';
import FileList from '@/components/file-list';
import GoldenSummary from '@/components/golden-summary';

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
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="flex items-center gap-4 mb-8">
					<Button variant="outline" size="sm" asChild>
						<Link to="/workspaces" className="flex items-center gap-2">
							<ArrowLeft className="w-4 h-4" />
							Back to Workspaces
						</Link>
					</Button>
				</div>

				<div className="flex items-center gap-4 mb-8">
					<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
						<Folder className="w-6 h-6 text-primary" />
					</div>
					<div>
						<h1 className="text-3xl font-bold">{workspace.name}</h1>
						{workspace.description && (
							<p className="text-gray-600 mt-1">{workspace.description}</p>
						)}
						<p className="text-sm text-gray-500 mt-2">
							Created {new Date(workspace.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>

				{/* Content */}
				{selectedFile ? (
					/* Summary View */
					<div className="space-y-6">
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
					/* File Management View */
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* File Upload */}
						<div className="space-y-6">
							<div>
								<h2 className="text-xl font-semibold mb-4">Upload Materials</h2>
								<FileUpload 
									workspaceId={workspaceId} 
									onUploadComplete={handleUploadComplete}
								/>
							</div>
						</div>

						{/* File List */}
						<div className="space-y-6">
							<div>
								<h2 className="text-xl font-semibold mb-4">Study Materials</h2>
								<FileList 
									workspaceId={workspaceId} 
									refreshTrigger={refreshTrigger}
									onViewSummary={handleViewSummary}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export const Route = createFileRoute('/workspaces/$workspaceId')({
	component: WorkspaceDetail,
});
