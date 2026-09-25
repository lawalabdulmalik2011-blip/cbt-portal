import { useRef, useState } from 'react';
import {
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { uploadStudentPhoto } from '../../lib/photos';
import Spinner from '../ui/Spinner.jsx';

export default function PhotoUploader({ value, onChange, studentId = 'new' }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadStudentPhoto(file, studentId);
      onChange(url);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function removePhoto() {
    onChange(null);
  }

  if (value) {
    return (
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200 group">
          <img src={value} alt="Student" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={removePhoto}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
            title="Remove"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">Photo attached</p>
          <p className="text-xs text-slate-400 mb-2">
            Shown in the exam room for identity verification
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <CameraIcon className="w-3.5 h-3.5" />
              Retake
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              <ArrowUpTrayIcon className="w-3.5 h-3.5" />
              Replace
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      className={`border-2 border-dashed rounded-2xl p-5 transition ${
        dragOver
          ? 'border-brand-500 bg-brand-50'
          : 'border-slate-300 hover:border-brand-400 bg-slate-50/50'
      }`}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {uploading ? (
        <div className="flex flex-col items-center py-2">
          <Spinner size={28} />
          <p className="text-sm text-slate-500 mt-2">Uploading…</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
            <PhotoIcon className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700 mb-1">
              Student photo
            </p>
            <p className="text-xs text-slate-400 mb-2">
              Optional — used for exam room verification
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <CameraIcon className="w-3.5 h-3.5" />
                Take photo
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}