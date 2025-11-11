import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { alertService, type AlertWithAgent, type AlertSeverity, type AlertStatus } from '../services/alertService';

export function Alerts() {
  const [alerts, setAlerts] = useState<AlertWithAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | AlertStatus>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | AlertSeverity>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await alertService.getAll();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await alertService.acknowledge(id);
      loadAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await alertService.resolve(id);
      loadAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await alertService.dismiss(id);
      loadAlerts();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-6 h-6 text-rose-600" />;
      case 'high':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-6 h-6 text-amber-600" />;
      case 'low':
        return <Bell className="w-6 h-6 text-slate-400" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'low':
        return 'bg-slate-50 border-slate-200 text-slate-900';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const summary = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
    high: alerts.filter(a => a.severity === 'high' && a.status === 'active').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Performance Alerts</h2>
        <p className="text-slate-600 mt-2">Monitor and manage agent performance notifications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Alerts</p>
          <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-700 mb-1">Active Alerts</p>
          <p className="text-2xl font-bold text-blue-900">{summary.active}</p>
        </div>
        <div className="bg-rose-50 rounded-lg border border-rose-200 p-4">
          <p className="text-sm text-rose-700 mb-1">Critical</p>
          <p className="text-2xl font-bold text-rose-900">{summary.critical}</p>
        </div>
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <p className="text-sm text-orange-700 mb-1">High Priority</p>
          <p className="text-2xl font-bold text-orange-900">{summary.high}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Filter:</span>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | AlertStatus)}
            className="px-3 py-1 border border-slate-300 rounded text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value as 'all' | AlertSeverity)}
            className="px-3 py-1 border border-slate-300 rounded text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-500">
            {filterStatus === 'all' && filterSeverity === 'all'
              ? 'No alerts. All systems performing normally.'
              : 'No alerts match your filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-xl border-2 p-6 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold">
                        {alertService.getAlertTypeLabel(alert.alert_type)}
                      </h3>
                      <span className="px-2 py-1 bg-white rounded-full text-xs font-medium">
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-700">
                        {alert.agents.name}
                      </span>
                    </div>

                    <p className="text-sm mb-3">{alert.message}</p>

                    {alert.details && Object.keys(alert.details).length > 0 && (
                      <div className="mt-3 p-3 bg-white bg-opacity-50 rounded-lg">
                        <p className="text-xs font-semibold mb-2">Additional Details:</p>
                        <div className="text-xs space-y-1">
                          {Object.entries(alert.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}: </span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 mt-3 text-xs text-slate-600">
                      <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
                      {alert.resolved_at && (
                        <span>Resolved: {new Date(alert.resolved_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {alert.status === 'active' && (
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors whitespace-nowrap"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200 transition-colors whitespace-nowrap"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors whitespace-nowrap"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {alert.status !== 'active' && (
                  <div className="ml-4">
                    <span className="px-3 py-2 bg-white rounded-lg text-sm font-medium">
                      {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
