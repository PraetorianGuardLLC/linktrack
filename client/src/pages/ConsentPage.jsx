// ConsentPage.jsx - shown before redirect when consentRequired=true
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, AlertTriangle } from 'lucide-react';
import api from '../api/client';

export function ConsentPage() {
  const { code } = useParams();
  const [agreed, setAgreed] = useState(false);
  const [link, setLink] = useState(null);

  useState(() => {
    api.get(`/links/${code}`).then((r) => setLink(r.data)).catch(() => {});
  }, [code]);

  const proceed = () => {
    window.location.href = `http://localhost:5000/${code}?consent=1`;
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-500/10 p-2 rounded-xl">
            <AlertTriangle size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-bold text-white">Consent Required</h2>
            <p className="text-xs text-slate-500">Before this link redirects you</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mb-4">
          This link collects the following data when clicked:
        </p>
        <ul className="space-y-2 mb-5 text-sm text-slate-400">
          {['Your IP address', 'Approximate location (city/country)', 'Browser & operating system', 'Device type', 'Referring URL'].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Shield size={13} className="text-brand-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 accent-brand-500"
          />
          <span className="text-sm text-slate-300">I understand and consent to this data collection</span>
        </label>
        <button
          disabled={!agreed}
          onClick={proceed}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
        >
          Proceed to destination
        </button>
      </div>
    </div>
  );
}

export default ConsentPage;
