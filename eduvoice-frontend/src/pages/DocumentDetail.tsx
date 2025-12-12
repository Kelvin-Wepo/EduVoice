import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, audioAPI } from '@/services/api';
import { Document, AudioFile } from '@/types';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GeminiReader } from '@/components/GeminiReader';
import { 
  FileText, 
  Loader, 
  Download, 
  Calendar, 
  User, 
  BookOpen,
  Sparkles,
  ArrowLeft,
  Settings,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [selectedTTSEngine, setSelectedTTSEngine] = useState<'gtts' | 'elevenlabs' | 'gemini'>('gtts');
  const [showGeminiReader, setShowGeminiReader] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const audioSectionRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      loadDocumentData();
    }
  }, [id]);

  const loadDocumentData = async () => {
    try {
      setLoading(true);
      const docData = await documentsAPI.get(parseInt(id!));
      setDocument(docData);

      // Fetch audio files for this document using the new endpoint
      try {
        const audioFiles = await documentsAPI.getAudioFiles(parseInt(id!));
        if (audioFiles && audioFiles.length > 0) {
          // Get the most recent completed audio file
          setAudioFile(audioFiles[0]);
        } else {
          setAudioFile(null);
          setAutoPlayAudio(false);
        }
      } catch (error) {
        console.log('No audio files found for this document');
        setAudioFile(null);
        setAutoPlayAudio(false);
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToAudio = async () => {
    if (!document) return;

    try {
      setConverting(true);
      toast.loading(`Converting document to audio using ${selectedTTSEngine.toUpperCase()}...`, { id: 'convert' });
      
      const audioData = await documentsAPI.convert(document.id, {
        engine: selectedTTSEngine
      });
      
      toast.success('Conversion started! Check back in a few moments.', { id: 'convert' });
      
      // Reload data after a few seconds to get the converted audio
      setTimeout(() => {
        loadDocumentData();
        // Enable auto-play after reload
        setAutoPlayAudio(true);
        // Scroll to audio section
        setTimeout(() => {
          audioSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 1000);
      }, 3000);
    } catch (error: any) {
      console.error('Failed to convert document:', error);
      const message = error.response?.data?.error || 'Failed to convert document to audio';
      toast.error(message, { id: 'convert' });
    } finally {
      setConverting(false);
    }
  };

  const handleGeminiRead = async (mode: string) => {
    if (!document) throw new Error('No document loaded');
    
    return await documentsAPI.geminiRead(document.id, {
      mode: mode,
      language: 'en'
    });
  };

  const handleDownloadDocument = () => {
    if (document?.file) {
      window.open(document.file, '_blank');
    }
  };

  const handleDownloadAudio = async () => {
    if (!audioFile) return;
    
    try {
      toast.loading('Downloading audio...', { id: 'download' });
      const blob = await audioAPI.download(audioFile.id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${document?.title || 'audio'}.mp3`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Audio downloaded successfully!', { id: 'download' });
    } catch (error) {
      console.error('Failed to download audio:', error);
      toast.error('Failed to download audio', { id: 'download' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-20">
        <FileText size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Document not found</h2>
        <p className="text-gray-600 mb-6">The document you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/library')}
          className="btn-primary"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      {/* Document Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                  <FileText size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{document.title}</h1>
                  <div className="flex items-center space-x-3 mt-2 text-purple-100">
                    <span className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span className="text-sm">{new Date(document.upload_date).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <User size={16} />
                      <span className="text-sm">{document.uploaded_by_name}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {document.description && (
                <p className="text-purple-100 text-lg">{document.description}</p>
              )}
            </div>

            <button
              onClick={handleDownloadDocument}
              className="px-4 py-2 bg-white/20 backdrop-blur-lg hover:bg-white/30 rounded-xl transition-all flex items-center space-x-2"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {document.course_name && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-lg rounded-lg text-sm">
                📚 {document.course_name}
              </span>
            )}
            {document.subject && (
              <span className="px-3 py-1 bg-white/20 backdrop-blur-lg rounded-lg text-sm">
                📖 {document.subject}
              </span>
            )}
            <span className="px-3 py-1 bg-white/20 backdrop-blur-lg rounded-lg text-sm uppercase">
              {document.file_type}
            </span>
          </div>
        </div>
      </div>

      {/* Audio Section */}
      {audioFile ? (
        <div ref={audioSectionRef} className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Audio Version</h2>
              {autoPlayAudio && (
                <p className="text-sm text-green-600 font-semibold mt-1">🎉 Auto-playing your audio...</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
                ✓ Available
              </span>
              <button
                onClick={handleDownloadAudio}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2 font-semibold"
              >
                <Download size={18} />
                <span>Download Audio</span>
              </button>
            </div>
          </div>
          <AudioPlayer audio={audioFile} autoPlay={autoPlayAudio} />
          {autoPlayAudio && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-l-4 border-green-500">
              <p className="text-green-800 text-sm">
                Your audio is ready! It's playing automatically. You can pause, adjust volume, or download it anytime.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-100">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-indigo-600" size={40} />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Convert to Audio
            </h2>
            
            <p className="text-gray-600 mb-6">
              Transform this document into an audio file for easy listening. Our AI will convert the text 
              to natural-sounding speech that you can listen to anywhere.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Play className="text-white" size={20} />
                </div>
                <h3 className="font-semibold text-blue-900 mb-1">Natural Voice</h3>
                <p className="text-sm text-blue-700">AI-powered speech synthesis</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Settings className="text-white" size={20} />
                </div>
                <h3 className="font-semibold text-purple-900 mb-1">Customizable</h3>
                <p className="text-sm text-purple-700">Choose voice & speed</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Download className="text-white" size={20} />
                </div>
                <h3 className="font-semibold text-green-900 mb-1">Download</h3>
                <p className="text-sm text-green-700">Listen offline anytime</p>
              </div>
            </div>

            {/* TTS Engine Selection */}
            <div className="mb-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Sparkles size={20} className="text-indigo-600" />
                <span>Choose Audio Engine</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* gTTS Option */}
                <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all" style={{
                  borderColor: selectedTTSEngine === 'gtts' ? '#4f46e5' : '#d1d5db',
                  backgroundColor: selectedTTSEngine === 'gtts' ? '#eef2ff' : '#ffffff'
                }}>
                  <input
                    type="radio"
                    name="tts-engine"
                    value="gtts"
                    checked={selectedTTSEngine === 'gtts'}
                    onChange={(e) => setSelectedTTSEngine(e.target.value as 'gtts' | 'elevenlabs' | 'gemini')}
                    className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-semibold text-gray-900">gTTS (Free)</p>
                    <p className="text-xs text-gray-600 mt-1">Fast & reliable. Standard voice quality.</p>
                  </div>
                </label>

                {/* ElevenLabs Option */}
                <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all" style={{
                  borderColor: selectedTTSEngine === 'elevenlabs' ? '#4f46e5' : '#d1d5db',
                  backgroundColor: selectedTTSEngine === 'elevenlabs' ? '#eef2ff' : '#ffffff'
                }}>
                  <input
                    type="radio"
                    name="tts-engine"
                    value="elevenlabs"
                    checked={selectedTTSEngine === 'elevenlabs'}
                    onChange={(e) => setSelectedTTSEngine(e.target.value as 'gtts' | 'elevenlabs' | 'gemini')}
                    className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-semibold text-gray-900">ElevenLabs (Premium)</p>
                    <p className="text-xs text-gray-600 mt-1">High-quality voices. Natural & expressive.</p>
                  </div>
                </label>

                {/* Gemini Option */}
                <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all" style={{
                  borderColor: selectedTTSEngine === 'gemini' ? '#4f46e5' : '#d1d5db',
                  backgroundColor: selectedTTSEngine === 'gemini' ? '#eef2ff' : '#ffffff'
                }}>
                  <input
                    type="radio"
                    name="tts-engine"
                    value="gemini"
                    checked={selectedTTSEngine === 'gemini'}
                    onChange={(e) => setSelectedTTSEngine(e.target.value as 'gtts' | 'elevenlabs' | 'gemini')}
                    className="w-4 h-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-semibold text-gray-900">Gemini AI (Enhanced)</p>
                    <p className="text-xs text-gray-600 mt-1">AI-enhanced text. Better pacing & clarity.</p>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={handleConvertToAudio}
              disabled={converting || document.status !== 'ready'}
              className="btn-primary !py-4 !px-8 text-lg relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              <span className="relative z-10 flex items-center space-x-2">
                {converting ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Convert to Audio</span>
                  </>
                )}
              </span>
            </button>

            {document.status !== 'ready' && (
              <p className="text-amber-600 mt-4 text-sm">
                Document must be in "ready" status before conversion
              </p>
            )}
          </div>
        </div>
      )}

      {/* Gemini Reader Section */}
      {document?.status === 'ready' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowGeminiReader(!showGeminiReader)}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Sparkles size={20} />
            <span>{showGeminiReader ? 'Hide' : 'Show'} Gemini AI Reader</span>
          </button>

          {showGeminiReader && (
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-100 animate-fadeIn">
              <GeminiReader 
                documentId={document.id}
                documentTitle={document.title}
                onRead={handleGeminiRead}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
