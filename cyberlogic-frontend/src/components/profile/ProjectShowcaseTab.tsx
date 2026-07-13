import { useState, useEffect } from "react";
import { Plus, ExternalLink, Pencil, Trash2, Briefcase, Loader2, Flag } from "lucide-react";
import { ImageCarousel, FullscreenImageViewer } from "../ui";
import { ProjectFormModal } from "./ProjectFormModal";
import { ReportModal } from "../forum/ReportModal";
import {
  fetchUserProjects,
  createUserProject,
  updateUserProject,
  deleteUserProject,
  type UserProject,
} from "../../utils/api";

interface ProjectShowcaseTabProps {
  userId: number;
  isOwnProfile: boolean;
}

export function ProjectShowcaseTab({ userId, isOwnProfile }: ProjectShowcaseTabProps) {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<UserProject | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reportProjectId, setReportProjectId] = useState<number | null>(null);

  // Fullscreen viewer state
  const [fullscreenImages, setFullscreenImages] = useState<string[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState<number>(0);

  useEffect(() => {
    loadProjects();
  }, [userId]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserProjects(userId);
      setProjects(data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: { title: string; description?: string; link?: string; images?: string[] }) => {
    await createUserProject(data);
    await loadProjects();
  };

  const handleUpdate = async (data: { title: string; description?: string; link?: string; images?: string[] }) => {
    if (!editingProject) return;
    await updateUserProject(editingProject.id, data);
    await loadProjects();
    setEditingProject(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this project permanently?")) return;
    setDeletingId(id);
    try {
      await deleteUserProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Projects & Works</h2>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="glass rounded-xl p-5 animate-pulse space-y-3">
            <div className="h-40 bg-surface-800 rounded-lg" />
            <div className="h-4 w-2/3 bg-surface-800 rounded" />
            <div className="h-3 w-full bg-surface-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" /> Projects & Works
          <span className="text-text-muted text-[10px] font-normal">({projects.length})</span>
        </h2>
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-[10px] font-bold hover:shadow-lg hover:shadow-primary/25 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        )}
      </div>

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <Briefcase className="w-10 h-10 text-text-muted/30 mx-auto mb-3" />
          <p className="text-xs text-text-muted">
            {isOwnProfile
              ? "You haven't added any projects yet. Showcase your work!"
              : "No projects to display yet."}
          </p>
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-surface-800 border border-border hover:bg-surface-700 text-xs font-semibold text-text-primary transition-all cursor-pointer"
            >
              Add Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="glass rounded-xl overflow-hidden border border-border/40 hover:border-border transition-colors">
              {/* Image Carousel */}
              {project.image_urls && project.image_urls.length > 0 && (
                <ImageCarousel
                  images={project.image_urls}
                  alt={project.title}
                  onImageClick={(idx) => {
                    setFullscreenImages(project.image_urls);
                    setFullscreenIndex(idx);
                  }}
                />
              )}

              {/* Content */}
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text-primary line-clamp-1">{project.title}</h3>
                    {project.description && (
                      <p className="text-xs text-text-secondary mt-1 line-clamp-3 leading-relaxed">{project.description}</p>
                    )}
                  </div>
                    {isOwnProfile && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => { setEditingProject(project); setIsModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-primary transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingId === project.id}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === project.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                    {!isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => setReportProjectId(project.id)}
                        className="p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors cursor-pointer flex-shrink-0"
                        title="Report Project"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Visit Project
                  </a>
                )}

                <div className="flex items-center gap-2 text-[10px] text-text-muted pt-1">
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  {project.image_urls && project.image_urls.length > 0 && (
                    <span>• {project.image_urls.length} image{project.image_urls.length > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
        onSave={editingProject ? handleUpdate : handleCreate}
        project={editingProject}
      />

      {/* Fullscreen Image Viewer */}
      <FullscreenImageViewer
        isOpen={fullscreenImages.length > 0}
        onClose={() => setFullscreenImages([])}
        images={fullscreenImages}
        defaultIndex={fullscreenIndex}
        alt="Project image"
      />

      {reportProjectId !== null && (
        <ReportModal
          isOpen={reportProjectId !== null}
          onClose={() => setReportProjectId(null)}
          reportableType="project"
          reportableId={reportProjectId}
        />
      )}
    </div>
  );
}
