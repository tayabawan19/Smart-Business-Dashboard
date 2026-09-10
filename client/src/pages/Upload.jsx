import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Layers,
  Hash,
  Calendar,
  Type,
  Database,
  ArrowLeft,
} from 'lucide-react';

export const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const MAX_SIZE_MB = 10;
  const ALLOWED_EXTS = ['.csv', '.xlsx', '.xls'];

  const validateFile = (file) => {
    if (!file) return false;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      toast.error(`Invalid file format "${ext}". Please select a .csv, .xlsx, or .xls file.`);
      return false;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is ${MAX_SIZE_MB}MB.`);
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first.');
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadDataset(selectedFile);
      setUploadResult(res.dataset);
      toast.success('Dataset parsed and stored successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getColumnTypeIcon = (type) => {
    switch (type) {
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-blue-400" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-emerald-400" />;
    }
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
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-400 uppercase tracking-wider mb-1">
            <UploadCloud className="w-4 h-4" />
            <span>Dataset Ingestion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Upload Business Data
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Import CSV or Excel files for validation, type inference, and AI analysis.
          </p>
        </div>

        <Link
          to="/datasets"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-dark-card border border-dark-border text-slate-300 hover:text-white hover:bg-dark-hover transition-colors self-start sm:self-auto"
        >
          <Database className="w-4 h-4 text-brand-400" />
          <span>My Datasets</span>
        </Link>
      </div>

      {!uploadResult ? (
        /* Upload Area Card */
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-dark-border space-y-6">
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
              dragActive
                ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
                : 'border-dark-border hover:border-brand-500/60 hover:bg-dark-hover/40 bg-dark-bg/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-glow mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <p className="text-base font-semibold text-white mb-1">
              {selectedFile ? selectedFile.name : 'Choose a file or drag & drop it here'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Supports CSV, Excel (.xlsx, .xls) up to 10MB. Files are validated and sanitized in memory.
            </p>

            <button
              type="button"
              className="px-4 py-2 bg-dark-card border border-dark-border hover:border-slate-600 text-xs font-semibold text-slate-200 rounded-xl transition-colors pointer-events-none"
            >
              {selectedFile ? 'Change File' : 'Browse Files'}
            </button>
          </div>

          {/* Selected File Details & Upload Action */}
          {selectedFile && (
            <div className="p-4 rounded-xl bg-dark-bg border border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Spreadsheet'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={resetUpload}
                  disabled={uploading}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-dark-hover rounded-xl border border-transparent hover:border-dark-border transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-glow transition-all duration-200 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Validating & Parsing...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload & Parse Data</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Security & Validation Information Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-slate-400 text-xs">
            <div className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border">
              <span className="font-semibold text-slate-200 block mb-1">🛡️ Memory-Only Parsing</span>
              Files are streamed and processed in memory, discarding raw files to protect confidentiality.
            </div>
            <div className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border">
              <span className="font-semibold text-slate-200 block mb-1">🧹 Formula Injection Defense</span>
              Cells with execution characters (=, +, -, @) are sanitized to prevent CSV injection attacks.
            </div>
            <div className="p-3.5 rounded-xl bg-dark-bg/60 border border-dark-border">
              <span className="font-semibold text-slate-200 block mb-1">🔍 Automatic Type Inference</span>
              Detects Numbers, Dates, and Categories automatically for upcoming charting in Phase 3.
            </div>
          </div>
        </div>
      ) : (
        /* Upload Success & Preview Table Card */
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-1">
                Status
              </span>
              <div className="flex items-center space-x-1.5 text-white font-bold text-base">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ready</span>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-brand-500/30 bg-brand-500/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-brand-400 block mb-1">
                Total Rows
              </span>
              <span className="text-lg font-extrabold text-white">
                {uploadResult.rowCount.toLocaleString()}
              </span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">
                Columns Detected
              </span>
              <span className="text-lg font-extrabold text-white">
                {uploadResult.columnCount}
              </span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block mb-1">
                File Size
              </span>
              <span className="text-lg font-extrabold text-white">
                {(uploadResult.fileSize / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          {/* Column Inferred Types Breakdown */}
          <div className="glass-card rounded-2xl p-5 border border-dark-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Inferred Column Types (Metadata for Charts)</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {uploadResult.columns.map((col, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-dark-bg border border-dark-border text-xs"
                >
                  <span className="font-semibold text-slate-200">{col.name}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${getColumnTypeBadge(
                      col.type
                    )}`}
                  >
                    {getColumnTypeIcon(col.type)}
                    <span>{col.type}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table Preview */}
          <div className="glass-card rounded-2xl border border-dark-border overflow-hidden space-y-3 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Data Preview ({uploadResult.preview?.length || 0} of {uploadResult.rowCount.toLocaleString()} rows)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Preview of sanitized records stored in MongoDB.
                </p>
              </div>

              <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-300">
                {uploadResult.fileName}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-dark-border bg-dark-bg/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-card border-b border-dark-border">
                    <th className="py-3 px-4 text-slate-500 font-semibold w-12 text-center">#</th>
                    {uploadResult.columns.map((col, idx) => (
                      <th key={idx} className="py-3 px-4 text-slate-200 font-semibold whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{col.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${getColumnTypeBadge(
                              col.type
                            )}`}
                          >
                            {col.type}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/50 text-slate-300">
                  {uploadResult.preview?.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-dark-hover/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-500 text-center font-mono text-[11px]">
                        {rowIdx + 1}
                      </td>
                      {uploadResult.columns.map((col, colIdx) => (
                        <td key={colIdx} className="py-2.5 px-4 whitespace-nowrap font-sans text-xs">
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

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={resetUpload}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-dark-card border border-dark-border text-slate-300 hover:text-white hover:bg-dark-hover transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Upload Another Dataset</span>
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Link
                to="/datasets"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-dark-bg border border-dark-border text-slate-200 hover:border-slate-600 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-brand-400" />
                <span>View in My Datasets</span>
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-glow transition-all"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
