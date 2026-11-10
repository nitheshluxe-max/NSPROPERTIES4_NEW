import React from 'react';
import { useProperty } from '../context/PropertyContext';
import { X, Scale, Check, Trash2 } from 'lucide-react';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({ isOpen, onClose }) => {
  const { comparisonList, toggleCompare, clearComparison, properties, setSelectedProperty } = useProperty();

  if (!isOpen) return null;

  const comparedProperties = properties.filter(p => comparisonList.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Property Comparison ({comparedProperties.length}/3)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {comparedProperties.length > 0 && (
              <button
                onClick={clearComparison}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {comparedProperties.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              <Scale className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>No properties added for comparison yet.</p>
              <p className="text-xs text-slate-400 mt-1">Check "Compare" on any property card to view specs side-by-side.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 font-bold text-slate-500 w-44 bg-slate-50">Property</th>
                    {comparedProperties.map(p => (
                      <th key={p.id} className="py-3 px-4 min-w-[220px]">
                        <div className="relative group">
                          <button
                            onClick={() => toggleCompare(p.id)}
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <img
                            src={(Array.isArray(p?.images) && p.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'}
                            alt={p?.title || 'Property'}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80';
                            }}
                            className="w-full h-28 object-cover rounded-lg mb-2"
                          />
                          <h4
                            onClick={() => {
                              setSelectedProperty(p);
                              onClose();
                            }}
                            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-1"
                          >
                            {p.title}
                          </h4>
                          <span className="text-sm font-extrabold text-blue-700 font-mono block mt-0.5">
                            {p.priceDisplay}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Type</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4 font-medium capitalize">{p.propertyType}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Location</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4">{p.locality}, {p.city}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Built-Up Area</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4 font-mono">{p.superBuiltUpArea.toLocaleString('en-IN')} sq.ft</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Carpet Area</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4 font-mono">{p.carpetArea ? `${p.carpetArea} sq.ft` : 'N/A'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Bedrooms</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4">{p.bedrooms ? `${p.bedrooms} BHK` : 'N/A'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Rate / Sq.Ft</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4 font-mono font-semibold">₹ {p.pricePerSqFt?.toLocaleString('en-IN') || 'N/A'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Possession</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4 text-emerald-700 font-semibold">{p.possession === 'ready' ? 'Ready to Move' : p.possessionDate}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Furnishing</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4 capitalize">{p.furnishing.replace('-', ' ')}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-semibold text-slate-500 bg-slate-50">Seller</td>
                    {comparedProperties.map(p => (
                      <td key={p.id} className="py-2.5 px-4">{p.seller?.name || 'Advisor'} ({p.seller?.type || 'owner'})</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
