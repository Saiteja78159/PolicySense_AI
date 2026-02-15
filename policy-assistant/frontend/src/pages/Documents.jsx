import { useState, useEffect } from 'react';
import { uploadDocument, listDocuments, deleteDocument } from '../lib/api';
import { FileText, Upload, Trash2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'hr', label: 'HR' },
  { value: 'legal', label: 'Legal' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'finance', label: 'Finance' },
  { value: 'general', label: 'General' },
];

export default function Documents() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('general');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const list = await listDocuments();
      setFiles(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      await uploadDocument(file, category, file.name);
      setSuccess(`"${file.name}" uploaded and indexed.`);
      load();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setError('');
    try {
      await deleteDocument(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-2">Company documents</h2>
      <p className="text-sm text-slate-500 mb-6">Upload HR, legal, compliance, or finance docs. They will be indexed for the assistant (PDF, DOCX, TXT).</p>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 text-sm font-medium">
          <Upload size={18} />
          {uploading ? 'Uploading...' : 'Upload file'}
          <input type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 mb-2">{success}</p>}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <p className="p-6 text-slate-500">Loading...</p>
        ) : files.length === 0 ? (
          <p className="p-6 text-slate-500">No documents yet. Upload a file above.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText className="text-slate-400" size={20} />
                  <div>
                    <p className="font-medium text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-500">{f.category} · {formatDate(f.created_at)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(f.id, f.name)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
