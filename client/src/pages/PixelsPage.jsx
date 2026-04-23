import { useState, useEffect } from 'react';
import { Copy, Plus, Image, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { pixelsApi } from '../api/links';
import { formatDistanceToNow } from 'date-fns';

export default function PixelsPage() {
  const [pixels, setPixels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [newPixel, setNewPixel] = useState(null);

  useEffect(() => {
    pixelsApi.list()
      .then(setPixels)
      .catch(() => toast.error('Failed to load pixels'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const pixel = await pixelsApi.create({ title });
      setPixels((prev) => [pixel, ...prev]);
      setNewPixel(pixel);
      setTitle('');
      toast.success('Pixel created!');
    } catch {
      toast.error('Failed to create pixel');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Tracking Pixels</h1>
        <p className="text-slate-400 text-sm">Invisible 1×1 image for email open tracking</p>
      </div>

      {/* Create form */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-medium text-slate-300 mb-3">Create new pixel</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            placeholder="Pixel label (e.g. Newsletter #42)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm transition"
          >
            <Plus size={15} />
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>

        {newPixel && (
          <div className="mt-4 space-y-3">
            <div className="bg-slate-900 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">Pixel URL</div>
              <div className="flex items-center gap-2">
                <code className="text-brand-400 text-xs flex-1 break-all">{newPixel.pixelUrl}</code>
                <button onClick={() => { navigator.clipboard.writeText(newPixel.pixelUrl); toast.success('Copied!'); }}>
                  <Copy size={14} className="text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
            <div className="bg-slate-900 rounded-xl p-3">
              <div className="text-xs text-slate-500 mb-1">HTML embed (paste into email)</div>
              <div className="flex items-center gap-2">
                <code className="text-green-400 text-xs flex-1 break-all">{newPixel.embedHtml}</code>
                <button onClick={() => { navigator.clipboard.writeText(newPixel.embedHtml); toast.success('Copied!'); }}>
                  <Copy size={14} className="text-slate-400 hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pixel list */}
      {loading ? (
        <div className="text-slate-500 text-center py-10">Loading…</div>
      ) : pixels.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <Image size={32} className="mx-auto mb-2 opacity-30" />
          No pixels yet
        </div>
      ) : (
        <div className="space-y-3">
          {pixels.map((p) => (
            <div key={p._id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-center gap-4">
              <Image size={18} className="text-brand-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm">{p.title}</div>
                <code className="text-xs text-slate-500">{p.pixelCode}</code>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="text-white font-semibold">{p.totalHits}</div>
                  <div className="text-xs text-slate-500">opens</div>
                </div>
                <div className="text-xs text-slate-600 hidden md:block">
                  {formatDistanceToNow(new Date(p.createdAt))} ago
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(p.pixelUrl); toast.success('URL copied!'); }}
                  className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-slate-700 transition"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
