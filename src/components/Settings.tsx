import { useEffect, useState } from 'react';
import { Save, Settings as SettingsIcon, Building2, Users } from 'lucide-react';
import { variableService } from '../services/variableService';
import { organizationService, type OrganizationSettings } from '../services/organizationService';

export function Settings() {
  const [variables, setVariables] = useState({
    usageDiscountPercent: 50,
    costPerHour: 20
  });
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings | null>(null);
  const [orgFormData, setOrgFormData] = useState({
    organization_name: '',
    total_employees: 100,
    fiscal_year_start_month: 1,
    standard_work_hours_per_year: 2080,
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [orgMessage, setOrgMessage] = useState('');

  useEffect(() => {
    loadVariables();
    loadOrgSettings();
  }, []);

  const loadVariables = async () => {
    try {
      const defaults = await variableService.getDefaults();
      setVariables(defaults);
    } catch (error) {
      console.error('Error loading variables:', error);
    }
  };

  const loadOrgSettings = async () => {
    try {
      const settings = await organizationService.getSettings();
      if (settings) {
        setOrgSettings(settings);
        setOrgFormData({
          organization_name: settings.organization_name || '',
          total_employees: settings.total_employees,
          fiscal_year_start_month: settings.fiscal_year_start_month,
          standard_work_hours_per_year: settings.standard_work_hours_per_year,
          notes: settings.notes || ''
        });
      }
    } catch (error) {
      console.error('Error loading organization settings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const allVars = await variableService.getAll();

      const discountVar = allVars.find(v => v.variable_name === 'default_usage_discount_percent');
      const costVar = allVars.find(v => v.variable_name === 'default_cost_per_hour');

      if (discountVar) {
        await variableService.update(discountVar.id, {
          variable_value: variables.usageDiscountPercent
        });
      }

      if (costVar) {
        await variableService.update(costVar.id, {
          variable_value: variables.costPerHour
        });
      }

      setMessage('Settings saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setOrgMessage('');

    try {
      await organizationService.updateSettings({
        organization_name: orgFormData.organization_name || null,
        total_employees: orgFormData.total_employees,
        fiscal_year_start_month: orgFormData.fiscal_year_start_month,
        standard_work_hours_per_year: orgFormData.standard_work_hours_per_year,
        notes: orgFormData.notes || null,
      });

      setOrgMessage('Organization settings saved successfully. FTE goals have been updated.');
      setTimeout(() => setOrgMessage(''), 5000);
      await loadOrgSettings();
    } catch (error) {
      console.error('Error saving organization settings:', error);
      setOrgMessage('Failed to save organization settings');
    } finally {
      setSaving(false);
    }
  };

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-2">Configure organization and study defaults</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Organization Settings</h3>
            <p className="text-sm text-slate-600">Configure company-wide information for accurate FTE impact calculations</p>
          </div>
        </div>

        <form onSubmit={handleOrgSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={orgFormData.organization_name}
                onChange={e => setOrgFormData({ ...orgFormData, organization_name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Your Company Name"
              />
              <p className="text-sm text-slate-500 mt-2">
                Optional: Name of your organization for reporting purposes
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total Employees *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  required
                  value={orgFormData.total_employees}
                  onChange={e => setOrgFormData({ ...orgFormData, total_employees: parseInt(e.target.value) || 1 })}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <p className="text-sm text-blue-600 mt-2 font-medium">
                Required for FTE impact percentage calculations
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fiscal Year Start Month
              </label>
              <select
                value={orgFormData.fiscal_year_start_month}
                onChange={e => setOrgFormData({ ...orgFormData, fiscal_year_start_month: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {monthOptions.map(month => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
              <p className="text-sm text-slate-500 mt-2">
                Month when your fiscal year begins
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Standard Work Hours Per Year
              </label>
              <input
                type="number"
                min="1"
                value={orgFormData.standard_work_hours_per_year}
                onChange={e => setOrgFormData({ ...orgFormData, standard_work_hours_per_year: parseInt(e.target.value) || 2080 })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-sm text-slate-500 mt-2">
                Standard hours for one FTE per year (default: 2080 = 40h/week × 52 weeks)
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={orgFormData.notes}
              onChange={e => setOrgFormData({ ...orgFormData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              rows={3}
              placeholder="Optional notes about your organization or configuration"
            />
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Organization Settings'}</span>
            </button>

            {orgMessage && (
              <p className={`text-sm font-medium ${
                orgMessage.includes('success') ? 'text-blue-600' : 'text-rose-600'
              }`}>
                {orgMessage}
              </p>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Default Variables</h3>
            <p className="text-sm text-slate-600">These values will be used as defaults when creating new studies</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Usage Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={variables.usageDiscountPercent}
                onChange={e => setVariables({ ...variables, usageDiscountPercent: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <p className="text-sm text-slate-500 mt-2">
                Percentage discount applied to usage count to account for realistic adoption rates.
                A 50% discount means only half of the theoretical usage will be realized.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Default Cost Per Employee Hour ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={variables.costPerHour}
                onChange={e => setVariables({ ...variables, costPerHour: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <p className="text-sm text-slate-500 mt-2">
                Average hourly cost per employee including salary, benefits, and overhead.
                Used to calculate potential cost savings from time saved.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>

            {message && (
              <p className={`text-sm font-medium ${
                message.includes('success') ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {message}
              </p>
            )}
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-slate-900 mb-3">About Default Variables</h4>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium">Usage Discount:</span> Represents the realistic adoption rate of AI tools.
            For example, if a task could theoretically be performed 10,000 times with AI, but adoption is 50%,
            the net usage would be 5,000 times.
          </p>
          <p>
            <span className="font-medium">Cost Per Hour:</span> Should include fully-loaded employee costs such as
            salary, benefits, payroll taxes, training, equipment, and facilities overhead. This provides a more
            accurate picture of true cost savings.
          </p>
          <p className="pt-2 border-t border-blue-200 mt-3">
            <span className="font-medium">Note:</span> While these are default values, you can override them for
            individual studies to accommodate variations in employee costs or adoption scenarios.
          </p>
        </div>
      </div>
    </div>
  );
}
