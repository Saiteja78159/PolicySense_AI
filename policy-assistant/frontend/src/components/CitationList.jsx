import { FileText } from 'lucide-react';

export function CitationList({ citations, documentNames }) {
  const byDoc = (citations || []).reduce((acc, c) => {
    const name = c.documentName || 'Unknown';
    if (!acc[name]) acc[name] = [];
    acc[name].push(c.snippet);
    return acc;
  }, {});

  const names = documentNames?.length ? documentNames : Object.keys(byDoc);

  return (
    <ul className="space-y-3">
      {names.map((name) => (
        <li key={name} className="flex gap-2 text-sm">
          <FileText className="mt-0.5 shrink-0 text-emerald-600" size={16} />
          <div>
            <span className="font-medium text-slate-700">{name}</span>
            {byDoc[name]?.length > 0 && (
              <p className="text-slate-500 mt-0.5 line-clamp-2">{byDoc[name][0]}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
