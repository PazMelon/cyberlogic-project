import { useMemo } from "react";
import { Link } from "react-router";
import { Compass, Briefcase, Image as ImageIcon, ArrowRight, ExternalLink } from "lucide-react";
import { SkeletonLine } from "../Skeleton";
import { ImageCarousel } from "../ui";
import type { UserProject, UserGalleryPhoto } from "../../utils/api";

interface ProfileOverviewTabProps {
  userActivities: any[];
  activitiesLoading: boolean;
  projects: UserProject[];
  projectsLoading: boolean;
  gallery: UserGalleryPhoto[];
  galleryLoading: boolean;
  onGoToTab: (tab: "overview" | "posts" | "showcase" | "gallery" | "saved" | "settings") => void;
}

export function ProfileOverviewTab({
  userActivities,
  activitiesLoading,
  projects = [],
  projectsLoading,
  gallery = [],
  galleryLoading,
  onGoToTab,
}: ProfileOverviewTabProps) {

  // Select a random project card once when projects load
  const randomProject = useMemo(() => {
    if (projects.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * projects.length);
    return projects[randomIndex];
  }, [projects]);

  // Select up to 10 random gallery pictures
  const randomGalleryUrls = useMemo(() => {
    if (gallery.length === 0) return [];
    // Shuffle copy of the array and take first 10
    const shuffled = [...gallery].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10).map((photo) => photo.image_url);
  }, [gallery]);

  return (
    <div className="space-y-6">

      {/* Grid of Showcases: Featured Project & Gallery Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Featured Project Showcase */}
        <div className="glass rounded-xl p-5 border border-border/40 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-primary" /> Featured Work
            </h3>

            {projectsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-28 bg-surface-800 rounded-lg" />
                <div className="h-4 bg-surface-800 rounded w-2/3" />
              </div>
            ) : randomProject ? (
              <div className="space-y-2.5">
                {randomProject.image_urls && randomProject.image_urls.length > 0 && (
                  <div className="rounded-lg overflow-hidden h-28 bg-surface-950 border border-border/10">
                    <img
                      src={randomProject.image_urls[0]}
                      alt={randomProject.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-text-primary line-clamp-1">{randomProject.title}</h4>
                  {randomProject.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                      {randomProject.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted">No projects added to showcase yet.</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => onGoToTab("showcase")}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary-light transition-colors"
            >
              Go to Showcase <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {randomProject?.link && (
              <a
                href={randomProject.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-text-primary transition-colors ml-auto"
              >
                <ExternalLink className="w-3 h-3" /> Visit Project
              </a>
            )}
          </div>
        </div>

        {/* Gallery Carousel Showcase */}
        <div className="glass rounded-xl p-5 border border-border/40 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <ImageIcon className="w-4 h-4 text-accent" /> Gallery Highlight
            </h3>

            {galleryLoading ? (
              <div className="aspect-video bg-surface-800 rounded-lg animate-pulse" />
            ) : randomGalleryUrls.length > 0 ? (
              <div className="rounded-lg overflow-hidden border border-border/20">
                <ImageCarousel images={randomGalleryUrls} className="aspect-video" />
              </div>
            ) : (
              <p className="text-xs text-text-muted">No photos uploaded to gallery yet.</p>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onGoToTab("gallery")}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent hover:text-accent-light transition-colors"
            >
              Go to Gallery <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" /> Overview Activity
          </h2>
        </div>

        <div className="space-y-3">
          {activitiesLoading ? (
            <div className="space-y-3">
              <SkeletonLine widthClass="w-full" heightClass="h-20" />
              <SkeletonLine widthClass="w-full" heightClass="h-20" />
            </div>
          ) : (
            userActivities.slice(0, 4).map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="glass rounded-xl p-4 hover:bg-white/5 transition-all border border-border/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activity.type === 'thread' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                  }`}>
                    {activity.type === 'thread' ? 'Started Thread' : 'Commented'}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <Link to={`/app/forums/thread/${activity.thread?.id}`} className="text-sm font-semibold text-text-primary hover:text-primary transition-colors line-clamp-1">
                  {activity.title}
                </Link>
                <p className="text-xs text-text-secondary line-clamp-2 bg-surface-900/30 p-2.5 rounded-lg border border-border/20">
                  {activity.content ? activity.content.replace(/<[^>]*>/g, '') : ''}
                </p>
              </div>
            ))
          )}
          {!activitiesLoading && userActivities.length === 0 && (
            <div className="glass rounded-xl p-6 text-center text-text-muted text-xs">
              No recent activity from this member.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

