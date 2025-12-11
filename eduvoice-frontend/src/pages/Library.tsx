import React, { useEffect, useState } from 'react';
import { documentsAPI, audioAPI } from '@/services/api';
import { Document, AudioFile } from '@/types';
import { DocumentCard } from '@/components/DocumentCard';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Search, Filter, Loader, FileText, Headphones, Play, Download, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'audio'>('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadLibraryData();
  }, [activeTab, fileTypeFilter, statusFilter]);

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'documents') {
        const params: any = {};
        if (fileTypeFilter) params.file_type = fileTypeFilter;
        if (statusFilter) params.status = statusFilter;
        if (searchQuery) params.search = searchQuery;

        const data = await documentsAPI.list(params);
        setDocuments(data.results);
      } else {
        const params: any = {};
        if (searchQuery) params.search = searchQuery;

        const data = await audioAPI.list(params);
        setAudioFiles(data.results);
      }
    } catch (error) {
      console.error('Failed to load library data:', error);
      toast.error('Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadLibraryData();
  };

  const handleConvert = async (document: Document) => {
    navigate(`/documents/${document.id}`);
  };

  const handleViewDocument = (document: Document) => {
    navigate(`/documents/${document.id}`);
  };

  const handleListenOnline = (document: Document) => {
    navigate(`/documents/${document.id}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Library</h1>
        <p className="text-gray-600">
          Browse your documents and audio files
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`
              pb-3 px-1 border-b-2 font-medium transition-colors
              ${activeTab === 'documents'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <FileText size={20} />
              <span>Documents</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`
              pb-3 px-1 border-b-2 font-medium transition-colors
              ${activeTab === 'audio'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <Headphones size={20} />
              <span>Audio Files</span>
            </div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="search"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* File Type Filter (Documents only) */}
          {activeTab === 'documents' && (
            <div>
              <label htmlFor="file-type" className="sr-only">File Type</label>
              <select
                id="file-type"
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
              </select>
            </div>
          )}

          {/* Status Filter (Documents only) */}
          {activeTab === 'documents' && (
            <div>
              <label htmlFor="status" className="sr-only">Status</label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="ready">Ready</option>
                <option value="processing">Processing</option>
                <option value="uploaded">Uploaded</option>
                <option value="error">Error</option>
              </select>
            </div>
          )}

          {/* Search Button */}
          <div className="md:col-span-4 md:col-start-1 flex justify-end">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="animate-spin text-primary-600" size={48} />
        </div>
      ) : (
        <>
          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              {documents.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <FileText size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No documents found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your filters or upload a new document
                  </p>
                  <button
                    onClick={() => navigate('/upload')}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      document={doc}
                      onView={handleViewDocument}
                      onConvert={handleConvert}
                      onListenOnline={handleListenOnline}
                      onDownloadAudio={handleDownloadAudio}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <div>
              {/* Info Banner */}
              <div className="mb-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                      <Info className="text-white" size={24} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-indigo-900 mb-2">
                      Flexible Listening Options
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-indigo-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Play className="text-white" size={16} />
                          </div>
                          <h4 className="font-semibold text-indigo-900">Stream Online</h4>
                        </div>
                        <p className="text-sm text-indigo-700">
                          Listen directly in your browser without downloading. Perfect for saving storage space and quick access.
                        </p>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-indigo-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <Download className="text-white" size={16} />
                          </div>
                          <h4 className="font-semibold text-indigo-900">Download for Offline</h4>
                        </div>
                        <p className="text-sm text-indigo-700">
                          Download audio files to listen offline anytime, anywhere. Great for commutes or areas with limited internet.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {audioFiles.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Headphones size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No audio files found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Convert your documents to audio to see them here
                  </p>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Browse Documents
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {audioFiles.map(audio => (
                    <AudioPlayer key={audio.id} audio={audio} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
