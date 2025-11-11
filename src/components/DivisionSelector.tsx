import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { divisionService } from '../services/divisionService';
import type { Database } from '../lib/database.types';

type Division = Database['public']['Tables']['divisions']['Row'];

interface DivisionSelectorProps {
  value: string | null;
  onChange: (divisionId: string | null) => void;
  showAllOption?: boolean;
  showUnassignedOption?: boolean;
  className?: string;
}

export default function DivisionSelector({
  value,
  onChange,
  showAllOption = true,
  showUnassignedOption = false,
  className = ''
}: DivisionSelectorProps) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDivisions();
  }, []);

  const loadDivisions = async () => {
    try {
      const data = await divisionService.getAll();
      setDivisions(data);
    } catch (error) {
      console.error('Error loading divisions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-slate-400 ${className}`}>
        <Building2 className="w-4 h-4" />
        <span className="text-sm">Loading divisions...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Building2 className="w-4 h-4 text-slate-600" />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {showAllOption && <option value="">All Divisions</option>}
        {showUnassignedOption && <option value="unassigned">Unassigned Agents</option>}
        {divisions.map((division) => (
          <option key={division.id} value={division.id}>
            {division.name}
          </option>
        ))}
      </select>
    </div>
  );
}
