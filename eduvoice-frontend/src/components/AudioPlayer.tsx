import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  SkipBack,
  SkipForward,
  Loader,
} from 'lucide-react';
import { AudioFile } from '@/types';
import { audioAPI } from '@/services/api';
import toast from 'react-hot-toast';

interface AudioPlayerProps {
  audio: AudioFile;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audio, autoPlay = false }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setLoading(false);
      toast.error('Failed to load audio file');
    };

    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);

    if (autoPlay) {
      audioElement.play().then(() => setPlaying(true)).catch(console.error);
    }

    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
    };
  }, [autoPlay]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
    if (vol === 0) {
      setMuted(true);
    } else if (muted) {
      setMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await audioAPI.download(audio.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${audio.document_title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download audio file');
    }
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="card p-6 border-l-4 border-purple-500" role="region" aria-label="Audio player">
      <audio
        ref={audioRef}
        src={audio.audio_url}
        preload="metadata"
        aria-label={`Audio for ${audio.document_title}`}
      />

      <div className="space-y-5">
        {/* Title and Actions */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{audio.document_title}</h3>
            <div className="flex items-center space-x-2 text-sm">
              <span className="badge bg-purple-100 text-purple-700">
                {audio.voice_type} voice
              </span>
              <span className="badge bg-blue-100 text-blue-700">
                {audio.language}
              </span>
            </div>
          </div>
          
          {/* Download Button - Prominent */}
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            aria-label="Download audio file"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>

        {/* Listening Mode Indicator */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border-l-4 border-blue-500">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Play size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Streaming Mode</p>
              <p className="text-xs text-blue-700">Listen online without downloading • Saves storage space</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative">
              <Loader className="animate-spin text-indigo-600" size={40} />
              <div className="absolute inset-0 animate-ping opacity-20">
                <Loader className="text-indigo-600" size={40} />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-200 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br 
                           [&::-webkit-slider-thumb]:from-indigo-600 [&::-webkit-slider-thumb]:to-purple-600 
                           [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                           [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                  style={{
                    background: `linear-gradient(to right, #6366f1 0%, #a855f7 ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%, #e5e7eb 100%)`
                  }}
                  aria-label="Seek audio"
                  aria-valuemin={0}
                  aria-valuemax={duration}
                  aria-valuenow={currentTime}
                />
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-3">
              {/* Skip Back */}
              <button
                onClick={() => skip(-10)}
                className="p-3 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110 text-gray-700 hover:text-indigo-600"
                aria-label="Skip back 10 seconds"
              >
                <SkipBack size={24} />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full hover:shadow-xl hover:scale-110 transition-all shadow-lg"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={28} /> : <Play size={28} className="ml-0.5" />}
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-3 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110 text-gray-700 hover:text-indigo-600"
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward size={24} />
              </button>
            </div>

            {/* Additional Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              {/* Volume */}
              <div className="flex items-center space-x-3 flex-1 max-w-xs">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-indigo-50 rounded-lg transition-all text-gray-700 hover:text-indigo-600"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 
                           [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                  aria-label="Volume"
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={volume}
                />
              </div>

              {/* Playback Speed */}
              <div className="flex items-center space-x-2">
                <label htmlFor="playback-speed" className="text-sm font-medium text-gray-700">
                  Speed:
                </label>
                <select
                  id="playback-speed"
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                  aria-label="Playback speed"
                >
                  {playbackRates.map(rate => (
                    <option key={rate} value={rate}>
                      {rate}x
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
