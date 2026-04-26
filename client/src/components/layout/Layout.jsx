import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Link2, LayoutDashboard, Image, LogOut, LogIn } from 'lucide-react';
import logo from '../../assets/linktracklogo.jpeg';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center">
  <img
    src={logo}
    alt="LinkTrack"
    className="h-12 w-auto object-contain"
  />
</Link>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition text-sm"
                >
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <Link
                  to="/pixels"
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition text-sm"
                >
                  <Image size={14} /> Pixels
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition text-sm ml-2"
                >
                  <LogOut size={14} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition text-sm flex items-center gap-1.5">
                  <LogIn size={14} /> Login
                </Link>
                <Link to="/register" className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg transition text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
