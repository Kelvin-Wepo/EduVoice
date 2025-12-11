import React, { useEffect, useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { coursesAPI } from '@/services/api';
import { Course } from '@/types';
import { Loader, Upload as UploadIcon, Sparkles, Zap, CheckCircle } from 'lucide-react';

export const Upload: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await coursesAPI.list();
      // Handle both array and paginated response
      if (Array.isArray(data)) {
        setCourses(data);
      } else if (data && typeof data === 'object' && 'results' in data) {
        // If paginated response
        setCourses((data as any).results || []);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]); // Ensure courses is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    // Could navigate or show success message
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl shadow-lg">
                  <UploadIcon size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Upload Document</h1>
                  <p className="text-purple-100 text-lg">
                    Convert your educational documents to accessible audio files
                  </p>
                </div>
              </div>
              <div className="hidden lg:flex items-center space-x-2 bg-white/20 backdrop-blur-lg px-4 py-2 rounded-xl">
                <Sparkles className="text-yellow-300" size={20} />
                <span className="text-white font-medium">AI-Powered</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap className="text-yellow-300" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Fast Conversion</p>
                    <p className="text-purple-100 text-sm">Under 2 minutes</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-green-300" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-semibold">High Quality</p>
                    <p className="text-purple-100 text-sm">Natural voices</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <UploadIcon className="text-blue-300" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Easy Upload</p>
                    <p className="text-purple-100 text-sm">Drag & drop files</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FileUploader courses={courses} onUploadSuccess={handleUploadSuccess} />

      {/* Tips Section */}
      <div className="mt-8 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">💡</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xl text-amber-900 mb-4 flex items-center">
              Tips for Best Results
              <Sparkles className="ml-2 text-amber-600" size={20} />
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start space-x-2 bg-white/60 backdrop-blur-sm rounded-lg p-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-amber-900 text-sm">Ensure your documents have clear, readable text</span>
              </div>
              <div className="flex items-start space-x-2 bg-white/60 backdrop-blur-sm rounded-lg p-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-amber-900 text-sm">Avoid image-based PDFs (scanned documents)</span>
              </div>
              <div className="flex items-start space-x-2 bg-white/60 backdrop-blur-sm rounded-lg p-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-amber-900 text-sm">File size limit: 10MB maximum</span>
              </div>
              <div className="flex items-start space-x-2 bg-white/60 backdrop-blur-sm rounded-lg p-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <span className="text-amber-900 text-sm">Supported: PDF, DOCX, TXT formats</span>
              </div>
            </div>
            <div className="mt-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-3 border border-amber-300">
              <p className="text-amber-900 text-sm font-medium">
                ✨ Pro Tip: After upload, customize voice settings for the perfect listening experience!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
