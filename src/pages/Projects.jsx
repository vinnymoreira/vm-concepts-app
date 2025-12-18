import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Search, Filter, X, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import Sidebar from '../partials/Sidebar';
import Header from '../partials/Header';
import AddProjectModal from '../partials/projects/AddProjectModal';
import ProjectTable from '../partials/projects/ProjectTable';
import ExpandableSearchBar from '../components/ExpandableSearchBar';

function Projects() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const { user, initialized } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!user || !initialized) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('deadline', { ascending: true, nullsFirst: false });

        if (projectsError) throw projectsError;

        // Fetch clients for dropdown and to join with projects
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, company, name')
          .eq('user_id', user.id)
          .order('company');

        if (clientsError) throw clientsError;

        // Manually join client data with projects
        const projectsWithClients = (projectsData || []).map(project => ({
          ...project,
          clients: clientsData?.find(c => c.id === project.client_id) || null
        }));

        if (isMounted) {
          setProjects(projectsWithClients);
          setClients(clientsData || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, initialized]);

  const handleAddProject = async (newProject) => {
    if (!user) {
      setError('You must be logged in to add projects.');
      return;
    }

    try {
      setLoading(true);
      const projectData = {
        ...newProject,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select('*');

      if (error) throw error;

      if (data) {
        // Manually add client data
        const projectsWithClients = data.map(project => ({
          ...project,
          clients: clients.find(c => c.id === project.client_id) || null
        }));
        setProjects(prev => [...prev, ...projectsWithClients]);
      }

      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Error adding project:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (updatedProject) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', updatedProject.id)
        .eq('user_id', user.id)
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        // Manually add client data
        const updatedWithClient = {
          ...data[0],
          clients: clients.find(c => c.id === data[0].client_id) || null
        };
        setProjects(prev =>
          prev.map(p => (p.id === updatedWithClient.id ? updatedWithClient : p))
        );
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err.message);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err.message);
    }
  };

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = !searchTerm ||
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.staging_site?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesAssignment = assignmentFilter === 'all' || project.assigned_to === assignmentFilter;

      return matchesSearch && matchesStatus && matchesAssignment;
    });
  }, [projects, searchTerm, statusFilter, assignmentFilter]);

  // Group projects by client
  const projectsByClient = useMemo(() => {
    const grouped = {};

    filteredProjects.forEach(project => {
      const clientKey = project.client_id || 'no_client';
      const clientName = project.clients?.company || 'No Client';

      if (!grouped[clientKey]) {
        grouped[clientKey] = {
          clientId: project.client_id,
          clientName: clientName,
          projects: []
        };
      }

      grouped[clientKey].projects.push(project);
    });

    return Object.values(grouped);
  }, [filteredProjects]);

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    return filteredProjects.reduce(
      (acc, project) => {
        // Only count revenue and profit for paid projects
        if (project.payment_received) {
          acc.totalNetIncome += parseFloat(project.net_income || 0);
          acc.totalProfit += parseFloat(project.profit || 0);
          acc.paidCount += 1;
        }
        acc.totalCost += parseFloat(project.cost || 0);
        // Count ongoing projects (open + in_progress)
        if (project.status === 'open' || project.status === 'in_progress') {
          acc.ongoingCount += 1;
        }
        return acc;
      },
      { totalNetIncome: 0, totalCost: 0, totalProfit: 0, paidCount: 0, ongoingCount: 0 }
    );
  }, [filteredProjects]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAssignmentFilter('all');
  };

  if (!initialized) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Authentication Required
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please sign in to view your projects.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="grow">
            <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
                <p className="text-gray-600 dark:text-gray-400">{error}</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="grow">
          <div className="px-4 sm:px-6 lg:px-8 py-8 w-full mx-auto">
            <div className="mb-8">
              <div className="sm:flex sm:justify-between sm:items-center mb-6">
                <div className="mb-4 sm:mb-0">
                  <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">
                    Project Manager
                  </h1>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Financial Summary */}
              {projects.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Ongoing Projects</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {financialSummary.ongoingCount}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-indigo-500" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {filteredProjects.length}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-gray-500" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ${financialSummary.totalNetIncome.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Profit</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ${financialSummary.totalProfit.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Filter Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-end gap-3 mb-2">
                  <ExpandableSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search projects..."
                  />
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white appearance-none bg-white dark:bg-gray-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="qa">QA</option>
                      <option value="complete">Complete</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <select
                      value={assignmentFilter}
                      onChange={(e) => setAssignmentFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white appearance-none bg-white dark:bg-gray-700"
                    >
                      <option value="all">All Assignments</option>
                      <option value="user">You</option>
                      <option value="brazil_team">Brazil Team</option>
                    </select>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm text-right">
                  Showing {filteredProjects.length} of {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                <span className="ml-2">Loading projects...</span>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  No projects yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  Get started by adding your first project to track work and manage deadlines
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  <span>Add Your First Project</span>
                </button>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  No projects match your current search and filter criteria
                </p>
                <button
                  onClick={clearFilters}
                  className="btn bg-gray-500 hover:bg-gray-600 text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  <span>Clear Filters</span>
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {projectsByClient.map((clientGroup) => (
                  <div key={clientGroup.clientId || 'no_client'}>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 px-2">
                      {clientGroup.clientName}
                    </h2>
                    <ProjectTable
                      projects={clientGroup.projects}
                      clients={clients}
                      onUpdate={handleUpdateProject}
                      onDelete={handleDeleteProject}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProject={handleAddProject}
        clients={clients}
      />
    </div>
  );
}

export default Projects;
