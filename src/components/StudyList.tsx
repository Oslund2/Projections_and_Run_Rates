import { useEffect, useState } from 'react';
import { Plus, Search, Download, Trash2, Calendar, Clock, DollarSign, Edit2 } from 'lucide-react';
import { studyService, type StudyWithAgent } from '../services/studyService';
import { formatCurrency, formatHours, formatNumber } from '../utils/calculations';
import { StudyForm } from './StudyForm';

export function StudyList() {
  const [studies, setStudies] = useState<StudyWithAgent[]>([]);
  const [filteredStudies, setFilteredStudies] = useState<StudyWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudy, setEditingStudy] = useState<StudyWithAgent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');

  useEffect(() => {
    loadStudies();
  }, []);

  useEffect(() => {
    filterStudies();
  }, [searchTerm, selectedAgent, studies]);

  const loadStudies = async () => {
    try {
      const data = await studyService.getAll();
      setStudies(data);
    } catch (error) {
      console.error('Error loading studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudies = () => {
    let filtered = [...studies];

    if (searchTerm) {
      filtered = filtered.filter(study =>
        study.task_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        study.agents.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        study.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedAgent !== 'all') {
      filtered = filtered.filter(study => study.agent_id === selectedAgent);
    }

    setFilteredStudies(filtered);
  };

  const handleEdit = (study: StudyWithAgent) => {
    setEditingStudy(study);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study?')) {
      return;
    }

    try {
      await studyService.delete(id);
      loadStudies();
    } catch (error) {
      console.error('Error deleting study:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStudy(null);
  };

  const exportToCSV = () => {
    const headers = [
      'Study Date',
      'Agent Name',
      'Task Description',
      'Time Without AI (min)',
      'Time With AI (min)',
      'Time Saved (min)',
      'Usage Count',
      'Usage Discount %',
      'Net Usage',
      'Cost Per Hour',
      'Net Time Saved (hours)',
      'Potential Savings'
    ];

    const rows = filteredStudies.map(study => [
      study.study_date,
      study.agents.name,
      study.task_description,
      study.time_without_ai_minutes,
      study.time_with_ai_minutes,
      study.time_saved_minutes || 0,
      study.usage_count,
      study.usage_discount_percent,
      study.net_usage || 0,
      study.cost_per_hour,
      study.net_time_saved_hours || 0,
      study.potential_savings || 0
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-motion-studies-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const uniqueAgents = Array.from(new Set(studies.map(s => s.agent_id)))
    .map(agentId => {
      const study = studies.find(s => s.agent_id === agentId);
      return study ? { id: agentId, name: study.agents.name } : null;
    })
    .filter(Boolean) as Array<{ id: string; name: string }>;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Time & Motion Studies</h2>
          <p className="text-slate-600 mt-2">Track and analyze task performance data</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="btn-secondary"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study</span>
          </button>
        </div>
      </div>

      <div className="card-elevated p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search studies by task, agent, or notes..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="all">All Agents</option>
            {uniqueAgents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredStudies.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <p className="text-slate-500 mb-4">
            {searchTerm || selectedAgent !== 'all'
              ? 'No studies match your filters.'
              : 'No studies found. Add your first study to get started.'}
          </p>
          {!searchTerm && selectedAgent === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Study</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudies.map(study => (
            <div
              key={study.id}
              className="card-elevated p-6 animate-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{study.task_description}</h3>
                    <span className="badge bg-accent-100 text-accent-700">
                      {study.agents.name}
                    </span>
                  </div>

                  {study.notes && (
                    <p className="text-sm text-slate-600 mb-3">{study.notes}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Study Date</p>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <p className="text-sm font-medium text-slate-900">
                          {new Date(study.study_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Time Saved</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {(study.time_saved_minutes || 0).toFixed(1)} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Usage Count</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatNumber(study.usage_count)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Net Usage</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatNumber(study.net_usage || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Net Time Saved</p>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-success-600" />
                        <p className="text-sm font-semibold text-success-700">
                          {formatHours(study.net_time_saved_hours || 0)}h
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Potential Savings</p>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3 text-success-600" />
                        <p className="text-sm font-semibold text-success-700">
                          {formatCurrency(study.potential_savings || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-6 text-xs text-slate-500">
                      <span>Without AI: {study.time_without_ai_minutes} min</span>
                      <span>With AI: {study.time_with_ai_minutes} min</span>
                      <span>Discount: {study.usage_discount_percent}%</span>
                      <span>Cost/Hour: ${study.cost_per_hour}</span>
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    onClick={() => handleEdit(study)}
                    className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    title="Edit study"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(study.id)}
                    className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-200"
                    title="Delete study"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <StudyForm
          study={editingStudy}
          onClose={handleCloseForm}
          onSuccess={loadStudies}
        />
      )}
    </div>
  );
}
