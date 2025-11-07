import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Project } from '../hooks/useProjects';

interface ProjectContextType {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  isRadiationProject: boolean;
  isLightPollutionProject: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const isRadiationProject = selectedProject?.project_type === 'radiation';
  const isLightPollutionProject = selectedProject?.project_type === 'light_pollution';

  // Persistir el proyecto seleccionado en localStorage
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    if (savedProjectId && !selectedProject) {
      // El proyecto se cargará cuando el selector lo recupere de la API
    }
  }, [selectedProject]);

  const handleSetSelectedProject = (project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      localStorage.setItem('selectedProjectId', project.id.toString());
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  };

  return (
    <ProjectContext.Provider 
      value={{ 
        selectedProject, 
        setSelectedProject: handleSetSelectedProject, 
        isRadiationProject, 
        isLightPollutionProject 
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};
