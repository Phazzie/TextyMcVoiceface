import React, { useState, useEffect } from 'react';
import {
  Save,
  FolderOpen,
  Plus,
  Search,
  Clock,
  FileText,
  Download,
  Upload,
  Trash2,
  Copy,
  Edit3,
  Tag,
  Calendar,
  Filter,
  Star,
  Archive,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader,
  X,
  MoreVertical
} from 'lucide-react';
import { SeamManager } from '../services/SeamManager';
import { StoryProject, ProjectTemplate } from '../types/contracts';

interface ProjectManagerProps {
  currentProject?: StoryProject;
  onProjectSelect: (project: StoryProject) => void;
  onNewProject: () => void;
  onSaveProject?: (project: StoryProject) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  currentProject,
  onProjectSelect,
  onNewProject,
  onSaveProject,
  isVisible,
  onClose
}) => {
  const [projects, setProjects] = useState<StoryProject[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'modified'>('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<{ totalProjects: number; totalSize: number; availableSpace: number } | null>(null);

  // Initialize project manager
  useEffect(() => {
    if (isVisible) {
      loadProjects();
      loadTemplates();
      loadStorageStats();
    }
  }, [isVisible]);

  const getProjectManager = () => {
    const seamManager = SeamManager.getInstance();
    return seamManager.getProjectManager();
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const projectManager = getProjectManager();
      const result = await projectManager.listProjects({
        sortBy,
        order: sortOrder
      });

      if (result.success && result.data) {
        setProjects(result.data);
      } else {
        setError(result.error || 'Failed to load projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const projectManager = getProjectManager();
      const result = await projectManager.getProjectTemplates();

      if (result.success && result.data) {
        setTemplates(result.data);
      }
    } catch (err) {
      console.warn('Failed to load templates:', err);
    }
  };

  const loadStorageStats = async () => {
    try {
      const projectManager = getProjectManager();
      const result = await projectManager.getStorageStats();

      if (result.success && result.data) {
        setStorageStats(result.data);
      }
    } catch (err) {
      console.warn('Failed to load storage stats:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProjects();
      return;
    }

    try {
      setLoading(true);
      const projectManager = getProjectManager();
      const result = await projectManager.searchProjects(searchQuery, {
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });

      if (result.success && result.data) {
        setProjects(result.data);
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentProject = async () => {
    if (!currentProject || !onSaveProject) return;

    try {
      setLoading(true);
      const projectManager = getProjectManager();
      const result = await projectManager.saveProject(currentProject);

      if (result.success) {
        onSaveProject(currentProject);
        loadProjects();
      } else {
        setError(result.error || 'Failed to save project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      setLoading(true);
      const projectManager = getProjectManager();
      const result = await projectManager.deleteProject(projectId);

      if (result.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        loadStorageStats();
      } else {
        setError(result.error || 'Failed to delete project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete error');
    } finally {
      setLoading(false);
      setProjectToDelete(null);
    }
  };

  const handleDuplicateProject = async (project: StoryProject) => {
    try {
      setLoading(true);
      const projectManager = getProjectManager();
      const result = await projectManager.duplicateProject(project.id, `${project.name} (Copy)`);

      if (result.success && result.data) {
        loadProjects();
      } else {
        setError(result.error || 'Failed to duplicate project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Duplicate error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportProject = async (project: StoryProject) => {
    try {
      setLoading(true);
      const projectManager = getProjectManager();
      const result = await projectManager.exportProject(project.id, {
        format: 'json',
        includeAudio: true,
        includeSettings: true,
        includeHistory: true,
        compression: 'none'
      });

      if (result.success && result.data) {
        const url = URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setError(result.error || 'Failed to export project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template: ProjectTemplate) => {
    try {
      setLoading(true);
      const projectManager = getProjectManager();
      const result = await projectManager.createProjectFromTemplate(
        template.id,
        `New ${template.name}`
      );

      if (result.success && result.data) {
        onProjectSelect(result.data);
        onClose();
      } else {
        setError(result.error || 'Failed to create project from template');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Template error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getAllTags = () => {
    const allTags = new Set<string>();
    projects.forEach(project => {
      project.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FolderOpen className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Project Manager</h2>
                <p className="text-blue-100">
                  Manage your audiobook projects and templates
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Storage Stats */}
          {storageStats && (
            <div className="mt-4 flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Archive className="w-4 h-4" />
                <span>{storageStats.totalProjects} projects</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{formatFileSize(storageStats.totalSize)} used</span>
              </div>
              {storageStats.availableSpace > 0 && (
                <div className="flex items-center space-x-1">
                  <Settings className="w-4 h-4" />
                  <span>{formatFileSize(storageStats.availableSpace)} available</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={onNewProject}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>

              {currentProject && onSaveProject && (
                <button
                  onClick={handleSaveCurrentProject}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Current</span>
                </button>
              )}

              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  showTemplates
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Templates</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="modified">Modified</option>
                <option value="created">Created</option>
                <option value="name">Name</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="processing">Processing</option>
              <option value="complete">Complete</option>
              <option value="error">Error</option>
            </select>

            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Tag Filter */}
          {getAllTags().length > 0 && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {getAllTags().map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag)
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : showTemplates ? (
            /* Templates View */
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">{template.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.category === 'fiction' ? 'bg-purple-100 text-purple-700' :
                        template.category === 'educational' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Projects Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'No projects match your search criteria' : 'Create your first audiobook project'}
              </p>
              <button
                onClick={onNewProject}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create New Project</span>
              </button>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`border-2 rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer ${
                    currentProject?.id === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => {
                    onProjectSelect(project);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 truncate flex-1 mr-2">
                      {project.name}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.metadata.completionStatus)}`}>
                        {project.metadata.completionStatus}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle menu - you'd implement this with state
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {/* Dropdown menu would go here */}
                      </div>
                    </div>
                  
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                  )}

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <span>Words: {project.metadata.wordCount.toLocaleString()}</span>
                      <span>{formatFileSize(project.metadata.fileSize)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Modified: {formatDate(project.metadata.modifiedAt)}</span>
                      <span>Characters: {project.characters.length}</span>
                    </div>
                  </div>

                  {project.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {project.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProject(project);
                      }}
                      className="flex-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportProject(project);
                      }}
                      className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                      }}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {projectToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-800">Delete Project</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this project? This action cannot be undone.
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(projectToDelete)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};