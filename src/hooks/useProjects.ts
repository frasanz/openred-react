import { useState, useEffect } from 'react';
import { Project } from '../types';

export type { Project };

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const baseURL = process.env.NODE_ENV === 'development' 
        ? '' // Usar proxy en desarrollo
        : (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000');
      
      const url = `${baseURL}/api/projects/`;
      
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error fetching projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshProjectCounts = async (projectId?: number) => {
    try {
      const baseURL = process.env.NODE_ENV === 'development' 
        ? '' // Usar proxy en desarrollo
        : (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000');
      
      const url = projectId 
        ? `${baseURL}/api/projects/${projectId}/`
        : `${baseURL}/api/projects/`;
      
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (projectId) {
        // Actualizar un proyecto específico
        setProjects(prevProjects => 
          prevProjects.map(p => p.id === projectId ? data : p)
        );
      } else {
        // Actualizar todos los proyectos
        setProjects(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error('Error refreshing project counts:', err);
    }
  };

  useEffect(() => {
    // Cargar todos los proyectos
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    refreshProjectCounts,
  };
};
