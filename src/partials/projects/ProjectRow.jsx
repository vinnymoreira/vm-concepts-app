import { useState, useRef, useEffect } from 'react';
import { Trash2, ExternalLink, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import DatePicker from '../../components/Datepicker';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  qa: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  complete: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  qa: 'QA',
  complete: 'Complete'
};

function ProjectRow({ project, onUpdate, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const inputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [editingField]);

  // Fetch user avatar from profile
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (!error && data?.avatar_url) {
          setUserAvatar(data.avatar_url);
        }
      } catch (err) {
        console.error('Error fetching avatar:', err);
      }
    };

    fetchUserAvatar();
  }, [user]);

  const startEditing = (field, value) => {
    setEditingField(field);
    // For date fields, format as YYYY-MM-DD to avoid timezone issues
    if (field === 'deadline' && value) {
      // If value is already in YYYY-MM-DD format, use it directly
      // Otherwise it's a Date object or timestamp, format it
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        setEditValue(value);
      } else {
        const date = new Date(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        setEditValue(`${year}-${month}-${day}`);
      }
    } else {
      setEditValue(value || '');
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async (field) => {
    if (editingField !== field) return;

    // Spread project but exclude the joined 'clients' data and generated 'profit' column
    const { clients: _clients, profit: _profit, ...projectData } = project;
    const updatedProject = { ...projectData };

    // Handle different field types
    if (field === 'net_income' || field === 'cost') {
      updatedProject[field] = parseFloat(editValue) || 0;
    } else if (field === 'payment_received') {
      updatedProject[field] = editValue === 'true';
    } else if (field === 'client_id') {
      updatedProject[field] = editValue || null;
    } else {
      updatedProject[field] = editValue;
    }

    await onUpdate(updatedProject);
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyDown = async (e, field) => {
    if (e.key === 'Enter') {
      await saveField(field);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const handleBlur = async (field) => {
    await saveField(field);
  };

  const toggleAssignment = async () => {
    const { clients: _clients, profit: _profit, ...projectData } = project;
    const newAssignment = project.assigned_to === 'user' ? 'brazil_team' : 'user';
    await onUpdate({ ...projectData, assigned_to: newAssignment });
  };

  const togglePayment = async () => {
    const { clients: _clients, profit: _profit, ...projectData } = project;
    await onUpdate({ ...projectData, payment_received: !project.payment_received });
  };

  const handleStatusChange = async (newStatus) => {
    const { clients: _clients, profit: _profit, ...projectData } = project;
    await onUpdate({ ...projectData, status: newStatus });
    setEditingField(null);
  };

  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        {/* Name */}
        <td className="px-4 py-3 whitespace-nowrap">
          {editingField === 'name' ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleBlur('name')}
              onKeyDown={(e) => handleKeyDown(e, 'name')}
              className="w-full px-2 py-1 text-sm border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="Last, First"
            />
          ) : (
            <div
              onClick={() => startEditing('name', project.name)}
              className="text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
            >
              {project.name || 'Click to add'}
            </div>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3 whitespace-nowrap">
          {editingField === 'status' ? (
            <select
              ref={inputRef}
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              onBlur={() => setEditingField(null)}
              className="pl-3 pr-8 py-1 text-xs font-medium rounded-full border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="qa">QA</option>
              <option value="complete">Complete</option>
            </select>
          ) : (
            <button
              onClick={() => setEditingField('status')}
              className={`px-4 py-1.5 text-sm font-medium rounded-full ${STATUS_COLORS[project.status]} hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap`}
            >
              {STATUS_LABELS[project.status]}
            </button>
          )}
        </td>

        {/* Assigned To */}
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            onClick={toggleAssignment}
            className="flex items-center justify-center p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            {project.assigned_to === 'user' ? (
              userAvatar ? (
                <img
                  src={userAvatar}
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )
            ) : (
              <span className="text-2xl">🇧🇷</span>
            )}
          </button>
        </td>

        {/* Deadline */}
        <td className="px-4 py-3 whitespace-nowrap">
          {editingField === 'deadline' ? (
            <input
              ref={inputRef}
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleBlur('deadline')}
              onKeyDown={(e) => handleKeyDown(e, 'deadline')}
              className="w-full px-2 py-1 text-sm border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <div
              onClick={() => startEditing('deadline', project.deadline)}
              className="text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
            >
              {formatDate(project.deadline)}
            </div>
          )}
        </td>

        {/* Payment Received */}
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            onClick={togglePayment}
            className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
              project.payment_received
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {project.payment_received ? '✓ Yes' : '✗ No'}
          </button>
        </td>

        {/* Net Income */}
        <td className="px-4 py-3 whitespace-nowrap text-right">
          {editingField === 'net_income' ? (
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleBlur('net_income')}
              onKeyDown={(e) => handleKeyDown(e, 'net_income')}
              className="w-full px-2 py-1 text-sm text-right border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <div
              onClick={() => startEditing('net_income', project.net_income)}
              className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
            >
              {project.payment_received ? formatCurrency(project.net_income) : formatCurrency(0)}
            </div>
          )}
        </td>

        {/* Cost */}
        <td className="px-4 py-3 whitespace-nowrap text-right">
          {editingField === 'cost' ? (
            <input
              ref={inputRef}
              type="number"
              step="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleBlur('cost')}
              onKeyDown={(e) => handleKeyDown(e, 'cost')}
              className="w-full px-2 py-1 text-sm text-right border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <div
              onClick={() => startEditing('cost', project.cost)}
              className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
            >
              {formatCurrency(project.cost)}
            </div>
          )}
        </td>

        {/* Profit (auto-calculated) */}
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {project.payment_received ? formatCurrency(project.profit) : formatCurrency(0)}
          </div>
        </td>

        {/* Links */}
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <div className="flex items-center justify-center gap-2">
            {project.trello_link && (
              <a
                href={project.trello_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                title="Open Trello"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm9.6-6.84c0 .795-.645 1.44-1.44 1.44H14.4c-.795 0-1.44-.645-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.2c.795 0 1.44.645 1.44 1.44v6.78z"/>
                </svg>
              </a>
            )}
            {project.design_link && (
              <a
                href={project.design_link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title="Open Design (Figma)"
              >
                <svg width="20" height="20" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
                  <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
                  <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
                  <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
                  <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
                </svg>
              </a>
            )}
            {project.staging_site && (
              <button
                onClick={() => copyToClipboard(project.staging_site)}
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                title="Copy Staging URL"
              >
                {copiedUrl === project.staging_site ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 whitespace-nowrap text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="Show details"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Details Row */}
      {isExpanded && (
        <tr className="bg-gray-50 dark:bg-gray-750">
          <td colSpan="10" className="px-4 py-4">
            <div className="space-y-4">
              {/* Row 1: Trello and Design Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trello Link */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trello Link
                  </label>
                  {editingField === 'trello_link' ? (
                    <input
                      ref={inputRef}
                      type="url"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleBlur('trello_link')}
                      onKeyDown={(e) => handleKeyDown(e, 'trello_link')}
                      className="w-full px-2 py-1 text-sm border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://trello.com/..."
                    />
                  ) : (
                    <div
                      onClick={() => startEditing('trello_link', project.trello_link)}
                      className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                    >
                      {project.trello_link ? (
                        <a
                          href={project.trello_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.trello_link}
                        </a>
                      ) : (
                        'Click to add'
                      )}
                    </div>
                  )}
                </div>

                {/* Design Link */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Design Link
                  </label>
                  {editingField === 'design_link' ? (
                    <input
                      ref={inputRef}
                      type="url"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleBlur('design_link')}
                      onKeyDown={(e) => handleKeyDown(e, 'design_link')}
                      className="w-full px-2 py-1 text-sm border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://figma.com/..."
                    />
                  ) : (
                    <div
                      onClick={() => startEditing('design_link', project.design_link)}
                      className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                    >
                      {project.design_link ? (
                        <a
                          href={project.design_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.design_link.length > 50
                            ? project.design_link.slice(0, 50) + '…'
                            : project.design_link}
                        </a>
                      ) : (
                        'Click to add'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Domain and Staging Site */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Domain */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Domain
                  </label>
                  {editingField === 'domain' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleBlur('domain')}
                      onKeyDown={(e) => handleKeyDown(e, 'domain')}
                      className="w-full px-2 py-1 text-sm border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="example.com"
                    />
                  ) : (
                    <div
                      onClick={() => startEditing('domain', project.domain)}
                      className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                    >
                      {project.domain ? (
                        <a
                          href={project.domain.startsWith('http') ? project.domain : `https://${project.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.domain.startsWith('http') ? project.domain : `https://${project.domain}`}
                        </a>
                      ) : (
                        'Click to add'
                      )}
                    </div>
                  )}
                </div>

                {/* Staging Site */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Staging Site
                  </label>
                  {editingField === 'staging_site' ? (
                    <input
                      ref={inputRef}
                      type="url"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleBlur('staging_site')}
                      onKeyDown={(e) => handleKeyDown(e, 'staging_site')}
                      className="w-full px-2 py-1 text-sm border border-indigo-500 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://stg.wpengine.com"
                    />
                  ) : (
                    <div
                      onClick={() => startEditing('staging_site', project.staging_site)}
                      className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 px-2 py-1 rounded"
                    >
                      {project.staging_site ? (
                        <a
                          href={project.staging_site}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.staging_site}
                        </a>
                      ) : (
                        'Click to add'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default ProjectRow;
