import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, X, File, FileText, FileType, Sparkles } from 'lucide-react';
import { documentsAPI } from '@/services/api';
import { Course } from '@/types';
import toast from 'react-hot-toast';

interface FileUploaderProps {
  courses: Course[];
  onUploadSuccess?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ courses, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState<number | undefined>();
  const [subject, setSubject] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      // Auto-fill title from filename
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);

    try {
      await documentsAPI.upload({
        title,
        description,
        file: selectedFile,
        course,
        subject,
        is_public: isPublic,
      });

      toast.success('Document uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setCourse(undefined);
      setSubject('');
      setIsPublic(false);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      const message = error.response?.data?.file?.[0] || 'Failed to upload document';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <File size={48} />;
    
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText size={48} className="text-red-500" />;
    if (ext === 'docx') return <FileType size={48} className="text-blue-500" />;
    return <FileText size={48} className="text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Document Details</h2>
        <div className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
          Step 1 of 1
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
            transition-all duration-300 relative overflow-hidden
            ${isDragActive 
              ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 scale-105' 
              : selectedFile
                ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
          `}
          role="button"
          aria-label="Drag and drop file upload area"
          tabIndex={0}
        >
          <input {...getInputProps()} aria-label="File input" />
          
          {selectedFile ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  {getFileIcon()}
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-lg">{selectedFile.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-medium flex items-center space-x-2 transition-colors"
                aria-label="Remove selected file"
              >
                <X size={16} />
                <span>Remove File</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                isDragActive 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-110' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              }`}>
                <UploadIcon size={40} className={isDragActive ? 'text-white' : 'text-gray-500'} aria-hidden="true" />
              </div>
              {isDragActive ? (
                <div className="text-center">
                  <p className="text-indigo-600 font-bold text-lg">Drop the file here!</p>
                  <p className="text-indigo-500 text-sm mt-1">Release to upload</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-700 font-semibold text-lg">
                    Drag & drop your file here
                  </p>
                  <p className="text-gray-500 mt-1">or</p>
                  <div className="mt-3 px-6 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg inline-block">
                    Click to Browse
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    📄 Supported: PDF, DOCX, TXT • Max 10MB
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
            Document Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="e.g., Introduction to Calculus"
            required
            aria-required="true"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="Add any additional notes or context about this document..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course */}
          <div>
            <label htmlFor="course" className="block text-sm font-semibold text-gray-900 mb-2">
              Course
            </label>
            <select
              id="course"
              value={course || ''}
              onChange={(e) => setCourse(e.target.value ? parseInt(e.target.value) : undefined)}
              className="input-field"
            >
              <option value="">Select a course (optional)</option>
              {Array.isArray(courses) && courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-field"
              placeholder="e.g., Mathematics, History"
            />
          </div>
        </div>

        {/* Public Checkbox */}
        <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="is_public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 mt-0.5"
            />
            <div>
              <label htmlFor="is_public" className="text-sm font-semibold text-gray-900 cursor-pointer">
                Make this document public
              </label>
              <p className="text-xs text-gray-600 mt-1">
                When enabled, all students in your organization can view and access this document
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className={`
            btn-primary w-full !py-4 text-base relative overflow-hidden group
            ${uploading || !selectedFile ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          aria-busy={uploading}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <span className="relative z-10 flex items-center justify-center space-x-2">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Uploading your document...</span>
              </>
            ) : (
              <>
                <UploadIcon size={20} />
                <span className="font-semibold">Upload Document</span>
                <Sparkles size={16} className="ml-1" />
              </>
            )}
          </span>
        </button>
      </form>
    </div>
  );
};
