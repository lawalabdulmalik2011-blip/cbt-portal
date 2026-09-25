import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import RoleBadge from './RoleBadge';

export default function UserTable({ users, loading, onToggleActive }) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14" />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-slate-500">No users yet. Click "Register" to add one.</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Exam Number</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Class / Subject</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-slate-50 hover:bg-slate-50/60 transition"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {u.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">
                        {u.full_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {u.exam_number?.toLowerCase().replace(/\//g, '-')}@exampro.local
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-sm text-slate-700">
                    {u.exam_number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={u.role} />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {u.class_level || u.subject_specialty || '—'}
                </td>
                <td className="px-6 py-4">
                  {u.is_active ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                      <CheckCircleIcon className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-500 text-sm font-medium">
                      <XCircleIcon className="w-4 h-4" /> Suspended
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onToggleActive?.(u)}
                    className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition ${
                      u.is_active
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {u.is_active ? 'Suspend' : 'Reactivate'}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}