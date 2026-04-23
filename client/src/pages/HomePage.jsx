import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Zap, Shield, Globe, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { linksApi } from '../api/links';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const link = await linksApi.create({ targetUrl: url.trim(), title, consentRequired: consent });
      setResult(link);
      toast.success('Tracking link created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(result.trackingUrl);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-brand-400 text-sm mb-6">
          <Zap size={14} /> Self-hosted IP tracker & URL shortener
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
          Track Links.<br />
          <span className="text-brand-400">Own Your Data.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Create tracked short links. See every click — IP address, location, device, browser — in real time.
          No ads. No third parties. All yours.
        </p>
      </div>

      {/* Create Form */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
          {!result ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">URL to track</label>
                <input
                  type="url"
                  placeholder="https://example.com/your-link"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Label (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Email campaign link"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-500"
                />
                <span className="text-sm text-slate-400">Show consent page before redirect (GDPR-friendly)</span>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Link2 size={18} />
                {loading ? 'Creating…' : 'Create Tracking Link'}
              </button>
              {!user && (
                <p className="text-xs text-slate-500 text-center">
                  <a href="/register" className="text-brand-400 hover:underline">Sign up</a> to save links and view analytics
                </p>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Link created — tracking active
              </div>
              <div className="bg-slate-900 rounded-xl p-4 flex items-center gap-3">
                <code className="text-brand-400 flex-1 text-sm break-all">{result.trackingUrl}</code>
                <button onClick={copyLink} className="text-slate-400 hover:text-white transition-colors">
                  Copy
                </button>
              </div>
              <div className="text-sm text-slate-400">
                <div>Target: <span className="text-slate-300">{result.targetUrl}</span></div>
              </div>
              <div className="flex gap-3">
                {user ? (
                  <button
                    onClick={() => navigate(`/analytics/${result.shortCode}`)}
                    className="flex-1 bg-brand-500/10 border border-brand-500/30 text-brand-400 py-2 rounded-xl hover:bg-brand-500/20 transition"
                  >
                    View Analytics
                  </button>
                ) : null}
                <button
                  onClick={() => { setResult(null); setUrl(''); setTitle(''); }}
                  className="flex-1 bg-slate-700 text-slate-300 py-2 rounded-xl hover:bg-slate-600 transition"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            { icon: Globe, label: 'Geolocation' },
            { icon: Eye, label: 'Real-time' },
            { icon: Shield, label: 'Private' },
            { icon: Zap, label: 'No ads' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-center">
              <Icon className="mx-auto mb-1 text-brand-400" size={20} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
