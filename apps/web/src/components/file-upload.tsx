import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { googleAuth } from "@/lib/google-auth";
import AUTH_CONFIG from "@/config/auth";
import { toast } from "sonner";

interface FileUploadProps {
	workspaceId: string;
	onUploadComplete?: () => void;
}

interface UploadFile {
	id: string;
	file: File;
	status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
	progress: number;
	error?: string;
}

export default function FileUpload({ workspaceId, onUploadComplete }: FileUploadProps) {
	const [files, setFiles] = useState<UploadFile[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const acceptedTypes = [
		'application/pdf',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
	];

	const maxFileSize = 10 * 1024 * 1024; // 10MB

	const handleFileSelect = (selectedFiles: FileList | null) => {
		if (!selectedFiles) return;

		const newFiles: UploadFile[] = [];
		
		Array.from(selectedFiles).forEach((file) => {
			// Validate file type
			if (!acceptedTypes.includes(file.type)) {
				toast.error(`${file.name}: Only PDF and DOCX files are supported`);
				return;
			}

			// Validate file size
			if (file.size > maxFileSize) {
				toast.error(`${file.name}: File size must be less than 10MB`);
				return;
			}

			newFiles.push({
				id: Math.random().toString(36).substr(2, 9),
				file,
				status: 'pending',
				progress: 0,
			});
		});

		setFiles(prev => [...prev, ...newFiles]);
	};

	const uploadFile = async (uploadFile: UploadFile) => {
		try {
			// Update status to uploading
			setFiles(prev => prev.map(f => 
				f.id === uploadFile.id 
					? { ...f, status: 'uploading', progress: 0 }
					: f
			));

			const token = googleAuth.getAccessToken();
			const formData = new FormData();
			formData.append('file', uploadFile.file);

			const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}/files`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
				credentials: 'include',
				body: formData,
			});

			const data = await response.json();

			if (response.ok && data.success) {
				// Update status to processing
				setFiles(prev => prev.map(f => 
					f.id === uploadFile.id 
						? { ...f, status: 'processing', progress: 50 }
						: f
				));

				// Poll for processing completion
				await pollFileStatus(uploadFile.id, data.file.id);
				
				toast.success(`${uploadFile.file.name} uploaded and processed successfully!`);
				onUploadComplete?.();
			} else {
				throw new Error(data.message || 'Upload failed');
			}
		} catch (error) {
			console.error('Upload error:', error);
			setFiles(prev => prev.map(f => 
				f.id === uploadFile.id 
					? { 
						...f, 
						status: 'error', 
						progress: 0,
						error: error instanceof Error ? error.message : 'Upload failed'
					}
					: f
			));
			toast.error(`Failed to upload ${uploadFile.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	};

	const pollFileStatus = async (uploadFileId: string, fileId: string) => {
		const maxAttempts = 30; // 30 seconds max
		let attempts = 0;

		const poll = async (): Promise<void> => {
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
					const file = data.files.find((f: { id: string; status: string }) => f.id === fileId);
					
					if (file?.status === 'ready') {
						setFiles(prev => prev.map(f => 
							f.id === uploadFileId 
								? { ...f, status: 'completed', progress: 100 }
								: f
						));
						return;
					}
				}

				attempts++;
				if (attempts < maxAttempts) {
					setTimeout(poll, 1000); // Poll every second
				} else {
					throw new Error('Processing timeout');
				}
			} catch {
				setFiles(prev => prev.map(f => 
					f.id === uploadFileId 
						? { 
							...f, 
							status: 'error', 
							progress: 0,
							error: 'Processing timeout'
						}
						: f
				));
			}
		};

		await poll();
	};

	const handleUploadAll = () => {
		const pendingFiles = files.filter(f => f.status === 'pending');
		pendingFiles.forEach(file => uploadFile(file));
	};

	const removeFile = (fileId: string) => {
		setFiles(prev => prev.filter(f => f.id !== fileId));
	};

	const retryUpload = (fileId: string) => {
		const file = files.find(f => f.id === fileId);
		if (file) {
			uploadFile(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragOver(false);
		handleFileSelect(e.dataTransfer.files);
	};

	const getStatusIcon = (status: UploadFile['status']) => {
		switch (status) {
			case 'pending':
				return <File className="w-4 h-4 text-gray-400" />;
			case 'uploading':
			case 'processing':
				return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
			case 'completed':
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case 'error':
				return <AlertCircle className="w-4 h-4 text-red-500" />;
		}
	};

	const getStatusText = (status: UploadFile['status']) => {
		switch (status) {
			case 'pending':
				return 'Ready to upload';
			case 'uploading':
				return 'Uploading...';
			case 'processing':
				return 'Processing document...';
			case 'completed':
				return 'Ready for study';
			case 'error':
				return 'Upload failed';
		}
	};

	const pendingCount = files.filter(f => f.status === 'pending').length;
	const processingCount = files.filter(f => f.status === 'uploading' || f.status === 'processing').length;

	return (
		<Card className="p-6">
			<div className="space-y-6">
				{/* Upload Area */}
				<div
					className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
						isDragOver 
							? 'border-primary bg-primary/5' 
							: 'border-gray-300 hover:border-gray-400'
					}`}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
				>
					<Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold mb-2">Upload Study Materials</h3>
					<p className="text-gray-600 mb-4">
						Drag and drop your PDF or DOCX files here, or click to browse
					</p>
					<p className="text-sm text-gray-500 mb-4">
						Supported formats: PDF, DOCX • Max size: 10MB per file
					</p>
					<Button 
						onClick={() => fileInputRef.current?.click()}
						className="flex items-center gap-2"
					>
						<Upload className="w-4 h-4" />
						Choose Files
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept=".pdf,.docx"
						onChange={(e) => handleFileSelect(e.target.files)}
						className="hidden"
					/>
				</div>

				{/* File List */}
				{files.length > 0 && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="font-semibold">Selected Files ({files.length})</h4>
							{pendingCount > 0 && (
								<Button 
									onClick={handleUploadAll}
									disabled={processingCount > 0}
									className="flex items-center gap-2"
								>
									<Upload className="w-4 h-4" />
									Upload All ({pendingCount})
								</Button>
							)}
						</div>

						<div className="space-y-2">
							{files.map((fileItem) => (
								<div key={fileItem.id} className="flex items-center gap-3 p-3 border rounded-lg">
									{getStatusIcon(fileItem.status)}
									<div className="flex-1 min-w-0">
										<p className="font-medium truncate">{fileItem.file.name}</p>
										<div className="flex items-center gap-4 text-sm text-gray-500">
											<span>{getStatusText(fileItem.status)}</span>
											<span>{(fileItem.file.size / 1024 / 1024).toFixed(1)} MB</span>
										</div>
										{fileItem.error && (
											<p className="text-sm text-red-600 mt-1">{fileItem.error}</p>
										)}
										{(fileItem.status === 'uploading' || fileItem.status === 'processing') && (
											<div className="w-full bg-gray-200 rounded-full h-2 mt-2">
												<div 
													className="bg-blue-500 h-2 rounded-full transition-all duration-300"
													style={{ width: `${fileItem.progress}%` }}
												/>
											</div>
										)}
									</div>
									<div className="flex gap-1">
										{fileItem.status === 'error' && (
											<Button
												size="sm"
												variant="outline"
												onClick={() => retryUpload(fileItem.id)}
											>
												Retry
											</Button>
										)}
										{fileItem.status === 'pending' && (
											<Button
												size="sm"
												onClick={() => uploadFile(fileItem)}
											>
												Upload
											</Button>
										)}
										<Button
											size="sm"
											variant="outline"
											onClick={() => removeFile(fileItem.id)}
											disabled={fileItem.status === 'uploading' || fileItem.status === 'processing'}
										>
											<X className="w-4 h-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
