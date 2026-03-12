import Link from 'next/link';
import type { CaseStudy } from '@/types/database';

interface PortfolioListProps {
  projects: CaseStudy[];
}

export function PortfolioList({ projects }: PortfolioListProps) {
  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/portfolio/${project.slug}`}
          className="block group"
        >
          <div className="flex items-center gap-4 p-4 rounded-xl ring-1 ring-white/5 hover:ring-accent/30 hover:bg-surface/40 transition-all">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent text-lg shrink-0">
              {project.industry?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text-primary group-hover:text-accent transition-colors truncate">
                {project.title}
              </h3>
              <p className="text-sm text-text-muted truncate">
                {project.client || project.industry}
              </p>
            </div>
            <span className="text-xs text-text-muted/60 font-mono shrink-0">
              {project.published_at ? new Date(project.published_at).getFullYear() : ''}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
