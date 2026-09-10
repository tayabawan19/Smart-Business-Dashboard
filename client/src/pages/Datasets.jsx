import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  Eye,
  Calendar,
  Layers,
  Hash,
  Type,
  X,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';

export const Datasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Preview Modal State
  const [previewDataset, setPreviewDataset] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await api.getDatasets();
      setDatasets(res.datasets || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleOpenPreview = async (datasetId) => {
    try {
      setPreviewLoading(true);
      const res = await api.getDatasetById(datasetId);
      setPreviewDataset(res.dataset);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to load dataset details.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await api.deleteDataset(deleteTarget._id);
      toast.success(`Dataset "${deleteTarget.fileName}" deleted.`);
      setDatasets((prev) => prev.filter((d) => d._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to delete dataset.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredDatasets = datasets.filter((d) =>
    d.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getColumnTypeBadge = (type) => {
    switch (type) {
      case 'number':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'date':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Dataset Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            My Datasets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your uploaded business datasets, schema definitions, and previews.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={fetchDatasets}
            disabled={loading}
            className="p-2.5 rounded-xl bg-dark-card border border-dark-border text-slate-300 hover:text-white hover:bg-dark-hover transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/upload"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-glow transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Dataset</span>
          </Link>
        </div>
      </div>

      {/* Search Input Filter */}
      {datasets.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search datasets by filename..."
            className="w-full bg-dark-card border border-dark-border text-sm text-slate-200 placeholder-slate-500 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
          />
        </div>
      )}

      {/* Dataset Table or Empty State */}
      {loading ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-dark-border">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading datasets...</p>
        </div>
      ) : datasets.length === 0 ? (
        /* Empty State */
        <div className="glass-card rounded-3xl p-10 sm:p-14 border border-dark-border text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto shadow-glow">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Datasets Uploaded Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Get started by uploading your first CSV or Excel spreadsheet. Your data will be validated, parsed, and prepared for visual analytics.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-glow transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Your First Dataset</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Datasets Grid / Table */
        <div className="glass-card rounded-2xl border border-dark-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-dark-card/90 border-b border-dark-border text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-5">Dataset Name</th>
                  <th className="py-3.5 px-5">Format</th>
                  <th className="py-3.5 px-5">Rows</th>
                  <th className="py-3.5 px-5">Columns</th>
                  <th className="py-3.5 px-5">Size</th>
                  <th className="py-3.5 px-5">Upload Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60 text-slate-300">
                {filteredDatasets.map((dataset) => (
                  <tr key={dataset._id} className="hover:bg-dark-hover/40 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-white flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-xs">{dataset.fileName}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-dark-bg border border-dark-border text-slate-300">
                        {dataset.fileType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-200">
                      {dataset.rowCount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {dataset.columnCount}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      {(dataset.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 whitespace-nowrap">
                      {formatDate(dataset.createdAt)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/dashboard?datasetId=${dataset._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                          title="Open Visual Dashboard"
                        >
                          <LineChart className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleOpenPreview(dataset._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
                          title="View Data Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(dataset)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Dataset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card rounded-2xl border border-dark-border w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-dark-border flex items-center justify-between bg-dark-card">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-md">
                    {previewDataset.fileName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {previewDataset.rowCount.toLocaleString()} rows • {previewDataset.columnCount} columns • {formatDate(previewDataset.createdAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewDataset(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Columns Detected */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Inferred Schema Columns
                </h4>
                <div className="flex flex-wrap gap-2">
                  {previewDataset.columns?.map((col, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-dark-bg border border-dark-border text-xs flex items-center space-x-1.5"
                    >
                      <span className="font-semibold text-slate-200">{col.name}</span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${getColumnTypeBadge(
                          col.type
                        )}`}
                      >
                        {col.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table Preview */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Sample Rows ({previewDataset.preview?.length || 0} shown)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-dark-border bg-dark-bg/60 max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-dark-card border-b border-dark-border">
                      <tr>
                        <th className="py-2.5 px-3 text-slate-500 font-semibold w-10 text-center">#</th>
                        {previewDataset.columns?.map((col, idx) => (
                          <th key={idx} className="py-2.5 px-3 text-slate-200 font-semibold whitespace-nowrap">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border/50 text-slate-300">
                      {previewDataset.preview?.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-dark-hover/40 transition-colors">
                          <td className="py-2 px-3 text-slate-500 text-center font-mono text-[10px]">
                            {rowIdx + 1}
                          </td>
                          {previewDataset.columns?.map((col, colIdx) => (
                            <td key={colIdx} className="py-2 px-3 whitespace-nowrap font-sans text-xs">
                              {row[col.name] !== undefined && row[col.name] !== null
                                ? String(row[col.name])
                                : <span className="text-slate-600 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-dark-border bg-dark-card flex justify-end">
              <button
                onClick={() => setPreviewDataset(null)}
                className="px-4 py-2 text-xs font-semibold bg-dark-bg border border-dark-border hover:border-slate-600 text-slate-200 rounded-xl transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="glass-card rounded-2xl border border-rose-500/30 w-full max-w-md p-6 space-y-4 shadow-2xl bg-dark-card">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete Dataset?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-200">"{deleteTarget.fileName}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-dark-bg border border-dark-border rounded-xl hover:bg-dark-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
