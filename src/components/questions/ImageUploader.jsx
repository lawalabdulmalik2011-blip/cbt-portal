import { useRef, useState } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { uploadQuestionImage } from '../../lib/questions';
import Spinner from '../ui/Spinner.jsx';

export default function ImageUploader({ value, onChange, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadQuestionImage(file);
      onChange(url);
      toast.success('Image uploaded');
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

  if (value) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
        <img
          src={value}
          alt="Question"
          className="w-full max-h-64 object-contain bg-slate-50"
        />
        <button
          type="button"
          onClick={() => {
            onRemove?.();
            onChange(null);
          }}
          className="absolute top-2 right-2 p-2 rounded-lg bg-white/90 backdrop-blur shadow-md text-rose-600 opacity-0 group-hover:opacity-100 transition"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
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
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
        dragOver
          ? 'border-brand-500 bg-brand-50'
          : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
      {uploading ? (
        <div className="py-2">
          <Spinner size={28} className="mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Uploading…</p>
        </div>
      ) : (
        <>
          <PhotoIcon className="w-9 h-9 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-700">
            Add an image (optional)
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PNG, JPG up to 5 MB — or drag and drop
          </p>
        </>
      )}
    </div>
  );
}