"use client";

import { useState } from "react";
import { ProjectSidebar } from "../components/project/project-sidebar";
import { ProjectHeader } from "../components/project/project-header";
import { ProjectBoard } from "../components/project/project-board";
import { cn } from "@/lib/utils";

interface ProjectLayoutProps {
  project: any; // Replace with your actual project type
  projects: any[]; // Replace with your actual projects type
  currentProjectId: string;
}

export default function ProjectLayout({ project, projects, currentProjectId }: ProjectLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen">
      <ProjectSidebar
        projects={projects}
        currentProjectId={currentProjectId}
      />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "ml-0" : "ml-80"
      )}>
        <ProjectHeader project={project} />
        <ProjectBoard project={project} />
      </div>
    </div>
  );
}