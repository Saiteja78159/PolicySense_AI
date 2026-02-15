import { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../lib/api';
import { CitationList } from '../components/CitationList';

export default function Dashboard() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState([]);
  const [documentNames, setDocumentNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [answer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    setError('');
    setAnswer('');
    setCitations([]);
    setDocumentNames([]);
    setLoading(true);
    try {
      const res = await askQuestion(question.trim());
      setAnswer(res.answer);
      setCitations(res.citations || []);
      setDocumentNames(res.documentNames || []);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Ask from company documents</h2>
        <p className="text-sm text-slate-500">Answers are based only on uploaded HR, legal, compliance, and finance docs. Sources are cited.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What is our leave policy?"
          className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-5 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Ask'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-white p-6 min-h-[200px]">
        {loading && (
          <p className="text-slate-500">Searching documents and generating answer...</p>
        )}
        {!loading && answer && (
          <>
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap text-slate-700">{answer}</p>
            </div>
            {(citations.length > 0 || documentNames.length > 0) && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Sources</h3>
                <CitationList citations={citations} documentNames={documentNames} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
        {!loading && !answer && !error && (
          <p className="text-slate-400">Ask a question above. Upload documents in the Documents tab first.</p>
        )}
      </div>
    </div>
  );
}
