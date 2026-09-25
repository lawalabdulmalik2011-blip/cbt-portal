import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MegaphoneIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import {
  listAnnouncements,
  deleteAnnouncement,
} from '../../lib/announcements';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import AnnouncementModal from '../../components/announcements/AnnouncementModal.jsx';

const PRIORITY_STYLE = {
  info: 'from-blue-500 to-blue-600',
  warning: 'from-amber-500 to-orange-600',
  urgent: 'from-rose-500 to-red-600',
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listAnnouncements();
      setItems(data);
    } catch (err) {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteAnnouncement(item.id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error('Failed');
    }
  }

  function handleEdit(item) {
    setEditItem(item);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-extrabold text-slate-900">
                Announcements
              </h1>
              <p className="text-slate-500 mt-2">
                Send messages to students and teachers
              </p>
            </div>
            <button
              onClick={() => {
                setEditItem(null);
                setModalOpen(true);
              }}
              className="btn-primary"
            >
              <PlusIcon className="w-5 h-5" />
              New
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <MegaphoneIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-800">
                No announcements yet
              </h3>
              <p className="text-slate-500 mt-2">
                Send your first message to students and teachers
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl p-5 relative overflow-hidden group"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${PRIORITY_STYLE[item.priority]}`}
                  />
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${PRIORITY_STYLE[item.priority]}`}
                    >
                      <MegaphoneIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            item.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : item.priority === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                        {!item.is_published && (
                          <span className="badge bg-slate-100 text-slate-500">
                            Draft
                          </span>
                        )}
                        {item.target_classes?.length > 0 && (
                          <span className="badge bg-slate-100 text-slate-600">
                            {item.target_classes.join(', ')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {item.content}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(item.created_at).toLocaleString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 rounded-lg text-brand-600 hover:bg-brand-50"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </PageTransition>

      <AnnouncementModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        announcement={editItem}
        onSaved={load}
      />
    </div>
  );
}