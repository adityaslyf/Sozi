import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Folder, Trash2, Edit, Calendar } from "lucide-react";
import { googleAuth } from "@/lib/google-auth";
import AUTH_CONFIG from "@/config/auth";
import { toast } from "sonner";

interface Workspace {
	id: string;
	name: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export default function WorkspaceManager() {
	const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
	});

	// Check if user is logged in
	const user = googleAuth.getCurrentUser();
	const isLoggedIn = googleAuth.isLoggedIn();

	useEffect(() => {
		if (isLoggedIn) {
			fetchWorkspaces();
		} else {
			setLoading(false);
		}
	}, [isLoggedIn]);

	const fetchWorkspaces = async () => {
		try {
			const token = googleAuth.getAccessToken();
			
			const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces`, {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setWorkspaces(data.workspaces);
			} else {
				console.error('Failed to fetch workspaces:', data);
				toast.error('Failed to load workspaces. Please try again.');
			}
		} catch (error) {
			console.error('Error fetching workspaces:', error);
			toast.error('Network error. Please check your connection.');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateWorkspace = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!formData.name.trim()) {
			toast.error('Workspace name is required');
			return;
		}

		try {
			const token = googleAuth.getAccessToken();
			
			const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					name: formData.name.trim(),
					description: formData.description.trim() || undefined,
				}),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setWorkspaces([...workspaces, data.workspace]);
				setFormData({ name: "", description: "" });
				setShowCreateForm(false);
				toast.success('Workspace created successfully!');
			} else {
				console.error('Failed to create workspace:', data);
				toast.error(data.message || 'Failed to create workspace. Please try again.');
			}
		} catch (error) {
			console.error('Error creating workspace:', error);
			toast.error('Network error. Please check your connection.');
		}
	};

	const handleUpdateWorkspace = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!editingWorkspace || !formData.name.trim()) {
			toast.error('Workspace name is required');
			return;
		}

		try {
			const token = googleAuth.getAccessToken();
			
			const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${editingWorkspace.id}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify({
					name: formData.name.trim(),
					description: formData.description.trim() || undefined,
				}),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setWorkspaces(workspaces.map(w => 
					w.id === editingWorkspace.id ? data.workspace : w
				));
				setFormData({ name: "", description: "" });
				setEditingWorkspace(null);
				toast.success('Workspace updated successfully!');
			} else {
				console.error('Failed to update workspace:', data);
				toast.error(data.message || 'Failed to update workspace. Please try again.');
			}
		} catch (error) {
			console.error('Error updating workspace:', error);
			toast.error('Network error. Please check your connection.');
		}
	};

	const handleDeleteWorkspace = async (workspaceId: string) => {
		// Show confirmation toast instead of confirm dialog
		toast('Delete Workspace?', {
			description: 'This action cannot be undone.',
			action: {
				label: 'Delete',
				onClick: () => performDeleteWorkspace(workspaceId),
			},
			cancel: {
				label: 'Cancel',
				onClick: () => {},
			},
		});
	};

	const performDeleteWorkspace = async (workspaceId: string) => {

		try {
			const token = googleAuth.getAccessToken();
			
			const response = await fetch(`${AUTH_CONFIG.API_BASE_URL}/workspaces/${workspaceId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			const data = await response.json();

			if (response.ok && data.success) {
				setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
				toast.success('Workspace deleted successfully!');
			} else {
				console.error('Failed to delete workspace:', data);
				toast.error(data.message || 'Failed to delete workspace. Please try again.');
			}
		} catch (error) {
			console.error('Error deleting workspace:', error);
			toast.error('Network error. Please check your connection.');
		}
	};

	const startEdit = (workspace: Workspace) => {
		setEditingWorkspace(workspace);
		setFormData({
			name: workspace.name,
			description: workspace.description || "",
		});
		setShowCreateForm(false);
	};

	const cancelEdit = () => {
		setEditingWorkspace(null);
		setFormData({ name: "", description: "" });
	};

	const startCreate = () => {
		setShowCreateForm(true);
		setEditingWorkspace(null);
		setFormData({ name: "", description: "" });
	};

	if (!isLoggedIn) {
		return (
			<div className="container mx-auto px-4 py-16 text-center">
				<h1 className="text-4xl font-bold mb-4">Access Denied</h1>
				<p className="text-gray-600 mb-8">You need to be logged in to manage workspaces.</p>
				<Button onClick={() => window.location.href = '/'}>
					Go to Home
				</Button>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-16 text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
				<p className="text-gray-600">Loading workspaces...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold">My Workspaces</h1>
						<p className="text-gray-600 mt-2">
							Organize your study materials into workspaces
						</p>
					</div>
					<Button onClick={startCreate} className="flex items-center gap-2">
						<Plus className="w-4 h-4" />
						New Workspace
					</Button>
				</div>

				{/* Create/Edit Form */}
				{(showCreateForm || editingWorkspace) && (
					<Card className="p-6 mb-8">
						<h2 className="text-xl font-semibold mb-4">
							{editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}
						</h2>
						<form onSubmit={editingWorkspace ? handleUpdateWorkspace : handleCreateWorkspace}>
							<div className="space-y-4">
								<div>
									<Label htmlFor="name">Workspace Name *</Label>
									<Input
										id="name"
										type="text"
										placeholder="e.g., Physics Semester 1"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
										maxLength={255}
										required
									/>
								</div>
								<div>
									<Label htmlFor="description">Description (Optional)</Label>
									<Input
										id="description"
										type="text"
										placeholder="Brief description of this workspace"
										value={formData.description}
										onChange={(e) => setFormData({ ...formData, description: e.target.value })}
										maxLength={500}
									/>
								</div>
								<div className="flex gap-2">
									<Button type="submit">
										{editingWorkspace ? 'Update Workspace' : 'Create Workspace'}
									</Button>
									<Button 
										type="button" 
										variant="outline" 
										onClick={editingWorkspace ? cancelEdit : () => setShowCreateForm(false)}
									>
										Cancel
									</Button>
								</div>
							</div>
						</form>
					</Card>
				)}

				{/* Workspaces Grid */}
				{workspaces.length === 0 ? (
					<Card className="p-12 text-center">
						<Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
						<p className="text-gray-600 mb-6">
							Create your first workspace to start organizing your study materials
						</p>
						<Button onClick={startCreate} className="flex items-center gap-2 mx-auto">
							<Plus className="w-4 h-4" />
							Create Your First Workspace
						</Button>
					</Card>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{workspaces.map((workspace) => (
							<Card key={workspace.id} className="p-6 hover:shadow-lg transition-shadow">
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
											<Folder className="w-5 h-5 text-primary" />
										</div>
										<div>
											<h3 className="font-semibold text-lg">{workspace.name}</h3>
											{workspace.description && (
												<p className="text-sm text-gray-600 mt-1">
													{workspace.description}
												</p>
											)}
										</div>
									</div>
								</div>
								
								<div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
									<Calendar className="w-3 h-3" />
									Created {new Date(workspace.createdAt).toLocaleDateString()}
								</div>

								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => startEdit(workspace)}
										className="flex items-center gap-1"
									>
										<Edit className="w-3 h-3" />
										Edit
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDeleteWorkspace(workspace.id)}
										className="flex items-center gap-1 text-red-600 hover:text-red-700"
									>
										<Trash2 className="w-3 h-3" />
										Delete
									</Button>
								</div>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
