import React from 'react';
import { Document } from '@/types';
import { FileText, Calendar, User, Download, AudioWaveform, Headphones, FileDown } from 'lucide-react';

interface DocumentCardProps {
  document: Document;
  onConvert?: (doc: Document) => void;
  onView?: (doc: Document) => void;
  onListenOnline?: (doc: Document) => void;
  onDownloadAudio?: (doc: Document) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onConvert,
  onView,
  onListenOnline,
  onDownloadAudio,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileTypeColor = (type: string): string => {
    switch (type) {
      case 'pdf':
        return 'text-red-500';
      case 'docx':
        return 'text-blue-500';
      case 'txt':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="card card-hover p-6 group relative border border-gray-100">
      {/* Status Badge - Absolute positioning */}
      <span
        className={`absolute top-4 right-4 badge ${getStatusColor(document.status)}`}
      >
        {document.status}
      </span>
      
      <div className="flex items-start space-x-4 mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${getFileTypeColor(document.file_type)} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <FileText className={getFileTypeColor(document.file_type)} size={28} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 pr-16">
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {document.title}
          </h3>
          {document.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{document.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {document.course_name && (
          <div className="inline-flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-lg">
            <span className="text-xs font-semibold text-indigo-700">📚 {document.course_name}</span>
          </div>
        )}

        {document.subject && (
          <div className="inline-flex items-center space-x-2 bg-purple-50 px-3 py-1.5 rounded-lg ml-2">
            <span className="text-xs font-semibold text-purple-700">📖 {document.subject}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 text-xs text-gray-600">
          <div className="flex items-center space-x-1.5">
            <User size={14} aria-hidden="true" className="text-gray-400" />
            <span>{document.uploaded_by.username}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Calendar size={14} aria-hidden="true" className="text-gray-400" />
            <span>{formatDate(document.upload_date)}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-medium">{document.file_type.toUpperCase()}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">{formatFileSize(document.file_size)}</span>
          </div>
        </div>

        {document.has_audio && (
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg mt-3">
            <AudioWaveform size={16} aria-hidden="true" className="text-green-600" />
            <span className="text-sm font-semibold text-green-700">Audio Ready</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        {document.has_audio ? (
          // Document has audio - show Listen Online and Download Audio buttons
          <>
            {onListenOnline && (
              <button
                onClick={() => onListenOnline(document)}
                className="flex-1 btn-primary !py-2.5 text-sm flex items-center justify-center space-x-2"
              >
                <Headphones size={16} />
                <span>Listen Online</span>
              </button>
            )}
            {onDownloadAudio && (
              <button
                onClick={() => onDownloadAudio(document)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg !py-2.5 text-sm flex items-center justify-center space-x-2 font-semibold"
              >
                <Download size={16} />
                <span>Download Audio</span>
              </button>
            )}
            {document.file_url && (
              <button
                onClick={() => window.open(document.file_url, '_blank')}
                className="p-2.5 border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group"
                aria-label="Download document file"
                title="Download Document"
              >
                <FileDown size={18} className="text-gray-600 group-hover:text-gray-800" />
              </button>
            )}
          </>
        ) : (
          // Document doesn't have audio - show View and Convert buttons
          <>
            {onView && (
              <button
                onClick={() => onView(document)}
                className="flex-1 btn-primary !py-2.5 text-sm"
              >
                View Details
              </button>
            )}
            {onConvert && document.status === 'ready' && (
              <button
                onClick={() => onConvert(document)}
                className="flex-1 btn-secondary !py-2.5 text-sm"
              >
                Convert to Audio
              </button>
            )}
            {document.file_url && (
              <button
                onClick={() => window.open(document.file_url, '_blank')}
                className="p-2.5 border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group"
                aria-label="Download document file"
                title="Download Document"
              >
                <FileDown size={18} className="text-gray-600 group-hover:text-gray-800" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
