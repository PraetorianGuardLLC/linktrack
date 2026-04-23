import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { io } from 'socket.io-client';
import { analyticsApi } from '../api/links';
import { ArrowLeft, Globe, Monitor, Wifi, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const COLORS = ['#4f6ef7', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8'];

const FlagEmoji = ({ code }) => (
  <span className="text-base">
    {code
      ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)))
      : '🌍'}
  </span>
);

export default function AnalyticsPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveClicks, setLiveClicks] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    analyticsApi.get(code)
      .then(setData)
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));

    // Connect WebSocket for real-time updates
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.emit('join-link', code);
    socket.on('new-click', (click) => {
      setLiveClicks((prev) => [click, ...prev].slice(0, 5));
      toast.custom((t) => (
        <div className={`bg-slate-800 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-white flex items-center gap-3 ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <div>
            <b>{click.city || click.country}</b> · {click.browser} on {click.os}
          </div>
        </div>
      ), { duration: 4000 });
    });

    return () => socket.disconnect();
  }, [code]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-slate-500">Loading analytics…</div>;
  }

  if (!data) return null;
  const { link, summary, charts, recentClicks } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{link.title || code}</h1>
          <p className="text-sm text-slate-500 truncate max-w-xs">{link.targetUrl}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Live tracking
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Clicks', value: summary.totalClicks, icon: Zap },
          { label: 'Unique IPs', value: summary.uniqueIps, icon: Wifi },
          { label: 'Countries', value: charts.byCountry.length, icon: Globe },
          { label: 'Browsers', value: charts.byBrowser.length, icon: Monitor },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">{label}</span>
              <Icon size={14} className="text-brand-400" />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Clicks over time */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Clicks over time (30 days)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={charts.clicksOverTime}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="count" stroke="#4f6ef7" fill="url(#grad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Countries */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Top countries</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {charts.byCountry.slice(0, 10).map((c, i) => (
              <div key={c.countryCode || i} className="flex items-center gap-2 text-sm">
                <FlagEmoji code={c.countryCode} />
                <span className="flex-1 text-slate-300 truncate">{c.country}</span>
                <span className="text-slate-500 text-xs">{c.count}</span>
                <div className="w-16 bg-slate-700 rounded-full h-1.5">
                  <div
                    className="bg-brand-500 rounded-full h-1.5"
                    style={{ width: `${(c.count / charts.byCountry[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Browser / OS / Device */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { title: 'Browsers', data: charts.byBrowser },
          { title: 'Operating Systems', data: charts.byOS },
          { title: 'Device Types', data: charts.byDevice },
        ].map(({ title, data: chartData }) => (
          <div key={title} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">{title}</h3>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  itemStyle={{ color: '#fff', fontSize: 11 }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Recent clicks table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-sm font-medium text-slate-300">Recent clicks</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                <th className="text-left px-4 py-2">IP</th>
                <th className="text-left px-4 py-2">Location</th>
                <th className="text-left px-4 py-2">Browser</th>
                <th className="text-left px-4 py-2">OS</th>
                <th className="text-left px-4 py-2">Device</th>
                <th className="text-left px-4 py-2">ISP</th>
                <th className="text-left px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentClicks.map((click) => (
                <tr key={click._id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                  <td className="px-4 py-2 font-mono text-xs text-brand-400">{click.ip}</td>
                  <td className="px-4 py-2 text-slate-300">
                    <span className="flex items-center gap-1">
                      <FlagEmoji code={click.geo?.countryCode} />
                      {click.geo?.city || click.geo?.country || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{click.browser?.name || '–'}</td>
                  <td className="px-4 py-2 text-slate-400">{click.os?.name || '–'}</td>
                  <td className="px-4 py-2 text-slate-400 capitalize">{click.device?.type || '–'}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs max-w-[120px] truncate">{click.geo?.isp || '–'}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(click.createdAt))} ago
                  </td>
                </tr>
              ))}
              {recentClicks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-600">No clicks yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
