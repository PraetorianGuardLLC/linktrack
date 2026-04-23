import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Copy, Trash2, ExternalLink, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { linksApi } from '../api/links';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    linksApi.list()
      .then(setLinks)
      .catch(() => toast.error('Failed to load links'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (code) => {
    if (!confirm(`Delete link /${code}?`)) return;
    try {
      await linksApi.delete(code);
      setLinks((prev) => prev.filter((l) => l.shortCode !== code));
      toast.success('Link deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Copied!');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Loading your links…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Links</h1>
          <p className="text-slate-400 text-sm">{links.length} tracked links</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
        >
          <Plus size={16} /> New Link
        </button>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No links yet. Create your first tracking link!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.shortCode}
              className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4 hover:border-slate-600 transition"
            >
              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${link.isActive ? 'bg-green-400' : 'bg-slate-600'}`} />

              {/* Link info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">{link.title || link.shortCode}</div>
                <div className="text-xs text-slate-500 truncate">{link.targetUrl}</div>
                <code className="text-xs text-brand-400">{link.trackingUrl}</code>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm text-slate-400 flex-shrink-0">
                <div className="text-center">
                  <div className="text-white font-semibold">{link.totalClicks}</div>
                  <div className="text-xs">clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">{link.uniqueIps}</div>
                  <div className="text-xs">unique</div>
                </div>
                <div className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(link.createdAt))} ago
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyLink(link.trackingUrl)}
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-700"
                  title="Copy tracking URL"
                >
                  <Copy size={15} />
                </button>
                <a
                  href={link.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-700"
                  title="Open target URL"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => navigate(`/analytics/${link.shortCode}`)}
                  className="text-slate-400 hover:text-brand-400 transition p-1.5 rounded-lg hover:bg-slate-700"
                  title="View analytics"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => handleDelete(link.shortCode)}
                  className="text-slate-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-slate-700"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
