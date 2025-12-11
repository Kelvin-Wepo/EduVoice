import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home,
  Upload,
  Library,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User,
  BarChart3,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { highContrast, toggleHighContrast } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: Home, roles: ['student', 'teacher', 'admin'] },
    { to: '/upload', label: 'Upload', icon: Upload, roles: ['student', 'teacher', 'admin'] },
    { to: '/library', label: 'Library', icon: Library, roles: ['student', 'teacher', 'admin'] },
    {
      to: '/admin',
      label: 'Admin',
      icon: BarChart3,
      roles: ['admin'],
    },
  ];

  const filteredLinks = navLinks.filter(link => !user || link.roles.includes(user.role));

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav
      className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl sticky top-0 z-50 backdrop-blur-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center space-x-3 hover:opacity-90 transition-opacity group"
            aria-label="EduVoice Notes Home"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">EV</span>
            </div>
            <span className="text-xl font-bold hidden sm:block">EduVoice Notes</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-all"
                aria-label={link.label}
              >
                <link.icon size={20} aria-hidden="true" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}

            <button
              onClick={toggleHighContrast}
              className="p-2.5 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-all ml-2"
              aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
            >
              {highContrast ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative ml-2">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <User size={18} className="text-indigo-600" />
                </div>
                <span className="font-medium">{user?.username}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-all font-medium ml-2"
              aria-label="Logout"
            >
              <LogOut size={20} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl hover:bg-white/20 backdrop-blur-sm transition-all"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 animate-slideIn" role="menu">
            {filteredLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center space-x-3 py-3 px-4 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
                role="menuitem"
              >
                <link.icon size={20} aria-hidden="true" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}

            <button
              onClick={toggleHighContrast}
              className="w-full flex items-center space-x-3 py-3 px-4 hover:bg-white/20 rounded-xl transition-all text-left backdrop-blur-sm"
              role="menuitem"
            >
              {highContrast ? <Sun size={20} /> : <Moon size={20} />}
              <span className="font-medium">{highContrast ? 'Normal Contrast' : 'High Contrast'}</span>
            </button>

            <div className="flex items-center space-x-3 py-3 px-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <User size={20} aria-hidden="true" />
              <span className="font-medium">{user?.username}</span>
            </div>

            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 py-3 px-4 hover:bg-white/20 rounded-xl transition-all text-left backdrop-blur-sm"
              role="menuitem"
            >
              <LogOut size={20} aria-hidden="true" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
