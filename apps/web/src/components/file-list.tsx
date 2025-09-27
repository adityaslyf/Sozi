import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { File, Trash2, Download, Calendar, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { googleAuth } from "@/lib/google-auth";
import AUTH_CONFIG from "@/config/auth";
import { toast } from "sonner";

interface FileItem {
	id: string;
	name: string;
	url: string;
	status: 'uploaded' | 'processing' | 'ready' | 'error';
	createdAt: string;
	updatedAt: string;
}

interface FileListProps {
	workspaceId: string;
	refreshTrigger?: number;
}

export default function FileList({ workspaceId, refreshTrigger }: FileListProps) {
	const [files, setFiles] = useState<FileItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchFiles();
	}, [workspaceId, refreshTrigger]);

	const fetchFiles = async () => {
		try {
			const token = googleAuth.getAccessToken();
			
			const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setFiles(data.files);
			} else {
				console.error('Failed to fetch files:', data);
				toast.error('Failed to load files. Please try again.');
			}
		} catch (error) {
			console.error('Error fetching files:', error);
			toast.error('Network error. Please check your connection.');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteFile = async (fileId: string, fileName: string) => {
		// Show confirmation toast
		toast('Delete File?', {
			description: `This will permanently delete "${fileName}" and all its processed data.`,
			action: {
				label: 'Delete',
				onClick: () => performDeleteFile(fileId, fileName),
			},
			cancel: {
				label: 'Cancel',
				onClick: () => {},
			},
		});
	};

	const performDeleteFile = async (fileId: string, fileName: string) => {
		try {
			const token = googleAuth.getAccessToken();
			
			const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files/${fileId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setFiles(files.filter(f => f.id !== fileId));
				toast.success(`${fileName} deleted successfully!`);
			} else {
				console.error('Failed to delete file:', data);
				toast.error(data.message || 'Failed to delete file. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting file:', error);
			toast.error('Network error. Please check your connection.');
		}
	};

	const getStatusIcon = (status: FileItem['status']) => {
		switch (status) {
			case 'uploaded':
				return <File className="w-4 h-4 text-gray-400" />;
			case 'processing':
				return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
			case 'ready':
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case 'error':
				return <AlertCircle className="w-4 h-4 text-red-500" />;
		}
	};

	const getStatusText = (status: FileItem['status']) => {
		switch (status) {
			case 'uploaded':
				return 'Uploaded';
			case 'processing':
				return 'Processing...';
			case 'ready':
				return 'Ready for study';
			case 'error':
				return 'Processing failed';
		}
	};

	const getStatusColor = (status: FileItem['status']) => {
		switch (status) {
			case 'uploaded':
				return 'text-gray-600';
			case 'processing':
				return 'text-blue-600';
			case 'ready':
				return 'text-green-600';
			case 'error':
				return 'text-red-600';
		}
	};

	if (loading) {
		return (
			<Card className="p-6">
				<div className="flex items-center justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin mr-2" />
					<span>Loading files...</span>
				</div>
			</Card>
		);
	}

	if (files.length === 0) {
		return (
			<Card className="p-8 text-center">
				<File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
				<h3 className="text-xl font-semibold mb-2">No files uploaded yet</h3>
				<p className="text-gray-600">
					Upload your first PDF or DOCX file to start studying with AI assistance
				</p>
			</Card>
		);
	}

	return (
		<Card className="p-6">
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">Files ({files.length})</h3>
					<Button 
						variant="outline" 
						size="sm" 
						onClick={fetchFiles}
					>
						Refresh
					</Button>
				</div>

				<div className="space-y-3">
					{files.map((file) => (
						<div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
							<div className="flex-shrink-0">
								{getStatusIcon(file.status)}
							</div>
							
							<div className="flex-1 min-w-0">
								<h4 className="font-medium truncate">{file.name}</h4>
								<div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
									<span className={getStatusColor(file.status)}>
										{getStatusText(file.status)}
									</span>
									<div className="flex items-center gap-1">
										<Calendar className="w-3 h-3" />
										<span>
											Uploaded {new Date(file.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							</div>

							<div className="flex gap-2">
								{file.status === 'ready' && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => window.open(file.url, '_blank')}
										className="flex items-center gap-1"
									>
										<Download className="w-3 h-3" />
										View
									</Button>
								)}
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleDeleteFile(file.id, file.name)}
									className="flex items-center gap-1 text-red-600 hover:text-red-700"
								>
									<Trash2 className="w-3 h-3" />
									Delete
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>
		</Card>
	);
}
