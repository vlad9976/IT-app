import React, { useState, useEffect } from 'react';
import { Award, Download, Loader2, RefreshCw } from 'lucide-react';
import { exportToCSV } from '../../utils/csvExport';

const ViewLicenses = () => {
  const [licenseReport, setLicenseReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenseReport();
  }, []);

  const loadLicenseReport = async () => {
    setLoading(true);
    try {
      const result = await window.electron.m365.getLicenseReport();
      if (result.success) {
        setLicenseReport(result.licenses);
      }
    } catch (error) {
      console.error('Failed to load license report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (licenseReport.length > 0) {
      exportToCSV(licenseReport, 'tenant_licenses');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Award className="w-5 h-5" />
          Tenant License Overview
        </h3>
        <div className="flex gap-2">
          <button
            onClick={loadLicenseReport}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={licenseReport.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {licenseReport.length > 0 ? (
        <div className="grid gap-3">
          {licenseReport.map((license) => (
            <div
              key={license.skuId}
              className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold">{license.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Status: {license.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">{license.available}</p>
                  <p className="text-xs text-slate-400">Available</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                      style={{ width: `${(license.assigned / license.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  <span className="font-semibold">{license.assigned}</span>
                  <span className="text-slate-500"> / </span>
                  <span>{license.total}</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-500">
                SKU ID: {license.skuId}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No licenses found</p>
        </div>
      )}
    </div>
  );
};

export default ViewLicenses;
