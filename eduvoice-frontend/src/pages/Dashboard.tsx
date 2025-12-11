import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsAPI, documentsAPI, audioAPI } from '@/services/api';
import { UserStatistics, Document, AudioFile } from '@/types';
import { DocumentCard } from '@/components/DocumentCard';
import { FileText, Headphones, Clock, Download, TrendingUp, Loader, Upload, Library, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [recentAudio, setRecentAudio] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, docsData, audioData] = await Promise.all([
        analyticsAPI.getUserStats(30),
        documentsAPI.list({ page: 1 }),
        audioAPI.list({ page: 1 }),
      ]);

      setStats(statsData);
      setRecentDocs(docsData.results.slice(0, 6));
      setRecentAudio(audioData.results.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAudio = async (document: Document) => {
    try {
      toast.loading('Preparing audio download...', { id: 'download' });
      
      // Get all audio files and find the one for this document
      const audioList = await audioAPI.list({ search: document.title });
      const audio = audioList.results.find(a => a.document === document.id);
      
      if (audio) {
        // Download the audio file
        const blob = await audioAPI.download(audio.id);
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = `${document.title}.mp3`;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('Audio downloaded successfully!', { id: 'download' });
      } else {
        toast.error('Audio file not found', { id: 'download' });
      }
    } catch (error) {
      console.error('Failed to download audio:', error);
      toast.error('Failed to download audio', { id: 'download' });
    }
  };

  const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
    gradient: string;
  }> = ({ icon, label, value, color, gradient }) => (
    <div className={`card card-hover p-6 border-l-4 ${color} relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-10 rounded-full -mr-16 -mt-16`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 ${gradient} bg-opacity-10 rounded-xl`}>
            <div className={color.replace('border-', 'text-')}>{icon}</div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="card bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24" />
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome back, {user?.first_name || user?.username}! 👋
          </h1>
          <p className="text-indigo-100 text-lg">
            {user?.role === 'student' && "Here's your learning dashboard"}
            {user?.role === 'teacher' && "Manage your course materials"}
            {user?.role === 'admin' && "System administration dashboard"}
          </p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<FileText size={28} />}
              label="Total Documents"
              value={stats.documents.total}
              color="border-blue-500"
              gradient="bg-blue-500"
            />
            <StatCard
              icon={<Headphones size={28} />}
              label="Audio Files"
              value={stats.audio.completed}
              color="border-green-500"
              gradient="bg-green-500"
            />
            <StatCard
              icon={<Clock size={28} />}
              label="Listening Time"
              value={`${stats.audio.total_listening_time_minutes} min`}
              color="border-yellow-500"
              gradient="bg-yellow-500"
            />
            <StatCard
              icon={<Download size={28} />}
              label="Total Downloads"
              value={stats.audio.total_downloads}
              color="border-purple-500"
              gradient="bg-purple-500"
            />
          </div>
        </div>
      )}

      {/* Recent Documents */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Documents</h2>
          <button
            onClick={() => navigate('/library')}
            className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center space-x-1 transition-colors"
          >
            <span>View All</span>
            <span>→</span>
          </button>
        </div>

        {recentDocs.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
              <FileText size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-6">Get started by uploading your first educational document</p>
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Upload size={20} />
              <span>Upload Your First Document</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentDocs.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={(doc) => navigate(`/documents/${doc.id}`)}
                onConvert={(doc) => navigate(`/documents/${doc.id}`)}
                onListenOnline={(doc) => navigate(`/documents/${doc.id}`)}
                onDownloadAudio={handleDownloadAudio}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/upload')}
            className="card card-hover p-8 text-left group bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-transparent hover:border-indigo-200"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Upload size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">Upload Document</h3>
            <p className="text-gray-600 text-sm">
              Add a new document to convert to audio
            </p>
          </button>

          <button
            onClick={() => navigate('/library')}
            className="card card-hover p-8 text-left group bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-transparent hover:border-green-200"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Library size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">Browse Library</h3>
            <p className="text-gray-600 text-sm">
              Access all your documents and audio files
            </p>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="card card-hover p-8 text-left group bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-transparent hover:border-purple-200"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl mb-4 group-hover:scale-110 transition-transform shadow-lg">
              <Settings size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">Settings</h3>
            <p className="text-gray-600 text-sm">
              Customize your accessibility preferences
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
