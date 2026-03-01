import React from 'react';
import { X, BookOpen, DollarSign, Users, Info, CheckCircle } from 'lucide-react';
import { m365LicenseDocumentation } from '../data/m365LicenseDocs';

const M365LicenseDocsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const renderLicenseSection = (section, key) => (
    <div key={key}>
      <h3 className={`text-lg font-semibold ${section.color} mb-3`}>
        {section.title}
      </h3>
      <div className="space-y-3">
        {section.licenses.map((license, idx) => (
          <div key={idx} className="bg-dark-bg rounded-lg p-4 border border-dark-border">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-semibold text-white text-lg">{license.name}</div>
                    <div className="text-sm text-gray-400 mb-1">{license.description}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-green-400 font-bold">{license.price}</div>
                    {license.userLimit && (
                      <div className="text-xs text-gray-500">{license.userLimit}</div>
                    )}
                  </div>
                </div>
                
                {license.sku && (
                  <div className="mb-2">
                    <span className="font-mono text-xs bg-slate-800 px-2 py-1 rounded text-blue-400">
                      SKU: {license.sku}
                    </span>
                  </div>
                )}
                
                <div className="space-y-1 mb-2">
                  {license.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-xs">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">
                    <span className="font-semibold text-blue-400">Best for:</span> {license.bestFor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-surface rounded-xl border border-dark-border max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-white">Microsoft 365 License Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Business Plans */}
          {renderLicenseSection(m365LicenseDocumentation.businessPlans, 'business')}

          {/* Enterprise Plans */}
          {renderLicenseSection(m365LicenseDocumentation.enterprisePlans, 'enterprise')}

          {/* Frontline Worker */}
          {renderLicenseSection(m365LicenseDocumentation.frontlineWorker, 'frontline')}

          {/* Add-Ons */}
          {renderLicenseSection(m365LicenseDocumentation.addOns, 'addons')}

          {/* Education */}
          {renderLicenseSection(m365LicenseDocumentation.education, 'education')}

          {/* Comparison Tips */}
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-800/50">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              {m365LicenseDocumentation.comparison.title}
            </h3>
            <div className="space-y-4">
              {m365LicenseDocumentation.comparison.tips.map((tip, idx) => (
                <div key={idx} className="bg-dark-bg/50 rounded-lg p-4 border border-dark-border">
                  <div className="font-semibold text-white mb-1">{tip.title}</div>
                  <div className="text-gray-400 text-sm">{tip.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Common SKUs Reference */}
          <div className="bg-gradient-to-br from-green-900/20 to-teal-900/20 rounded-lg p-6 border border-green-800/50">
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              {m365LicenseDocumentation.commonSkus.title}
            </h3>
            <p className="text-gray-400 text-sm mb-4">{m365LicenseDocumentation.commonSkus.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {m365LicenseDocumentation.commonSkus.skus.map((sku, idx) => (
                <div key={idx} className="bg-dark-bg/50 rounded p-3 border border-dark-border">
                  <div className="text-white text-sm mb-1">{sku.display}</div>
                  <div className="font-mono text-xs text-blue-400">{sku.sku}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Note */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <span className="font-semibold text-yellow-400">Note:</span> Prices shown are approximate USD annual commitment pricing. 
                Actual prices may vary by region, currency, and commitment term. Contact Microsoft or a partner for current pricing.
                Educational pricing requires verification of eligibility.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-dark-border flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default M365LicenseDocsModal;
