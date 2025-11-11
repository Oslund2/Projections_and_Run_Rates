import { useState, useEffect, useRef } from 'react';
import { Plus, Building2, Edit2, Trash2, Users } from 'lucide-react';
import { divisionService } from '../services/divisionService';
import type { Database } from '../lib/database.types';

type Division = Database['public']['Tables']['divisions']['Row'];

export default function DivisionManagement() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget_owner: '',
    parent_id: null as string | null
  });
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDivisions();
  }, []);


  const loadDivisions = async () => {
    try {
      setLoading(true);
      const data = await divisionService.getAll();
      setDivisions(data);
    } catch (error) {
      console.error('Error loading divisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await divisionService.update(editingId, formData);
      } else {
        await divisionService.create(formData);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', budget_owner: '', parent_id: null });
      loadDivisions();
    } catch (error) {
      console.error('Error saving division:', error);
    }
  };

  const handleEdit = (division: Division) => {
    setEditingId(division.id);
    setFormData({
      name: division.name,
      description: division.description || '',
      budget_owner: division.budget_owner,
      parent_id: division.parent_id
    });
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this division? This will remove division assignment from all associated agents.')) {
      try {
        await divisionService.delete(id);
        loadDivisions();
      } catch (error) {
        console.error('Error deleting division:', error);
      }
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', budget_owner: '', parent_id: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading divisions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Division Management</h2>
          <p className="text-slate-600 mt-1">Organize agents by business unit and budget owner</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Division
          </button>
        )}
      </div>

      {showForm && (
        <div ref={formRef} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Edit Division' : 'New Division'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Division Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., News, HR, Legal"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Budget Owner
              </label>
              <input
                type="text"
                value={formData.budget_owner}
                onChange={(e) => setFormData({ ...formData, budget_owner: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Name of budget owner"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this division"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Parent Division (Optional)
              </label>
              <select
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None (Top Level)</option>
                {divisions
                  .filter(d => d.id !== editingId)
                  .map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Update' : 'Create'} Division
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {divisions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No divisions created yet</p>
            <p className="text-sm text-slate-500 mt-1">Create your first division to organize agents by business unit</p>
          </div>
        ) : (
          divisions.map((division) => (
            <div
              key={division.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">{division.name}</h3>
                  </div>
                  {division.description && (
                    <p className="text-slate-600 text-sm mb-3">{division.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span>Budget Owner: {division.budget_owner}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(division)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit division"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(division.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete division"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
