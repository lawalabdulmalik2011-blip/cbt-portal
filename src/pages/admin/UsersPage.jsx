import { useEffect, useState, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  UserPlusIcon,
  ArrowUpTrayIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { listUsers, setUserActive } from '../../lib/admin';
import TopBar from '../../components/ui/TopBar.jsx';
import PageTransition from '../../components/ui/PageTransition.jsx';
import UserTable from '../../components/admin/UserTable.jsx';
import CreateUserModal from '../../components/admin/CreateUserModal.jsx';
import BulkImportModal from '../../components/admin/BulkImportModal.jsx';
import EditUserModal from '../../components/admin/EditUserModal.jsx';
import ResetPasswordModal from '../../components/admin/ResetPasswordModal.jsx';
import PrintSlipsModal from '../../components/admin/PrintSlipsModal.jsx';

const ROLE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'student', label: 'Students' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'admin', label: 'Admins' },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [selectedIds, setSelectedIds] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUsers({
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: search.trim() || undefined,
      });
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 250);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  async function handleToggleActive(user) {
    try {
      await setUserActive(user.id, !user.is_active);
      toast.success(user.is_active ? 'User suspended' : 'User reactivated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  }

  function handleEdit(user) {
    setCurrentUser(user);
    setEditOpen(true);
  }

  function handleReset(user) {
    setCurrentUser(user);
    setResetOpen(true);
  }

  function handlePrintSelected() {
    if (selectedIds.length === 0) {
      toast.error('Select at least one user to print');
      return;
    }
    setPrintOpen(true);
  }

  function handlePrintAll() {
    if (users.length === 0) return;
    setSelectedIds(users.map((u) => u.id));
    setPrintOpen(true);
  }

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar variant="teacher" />
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-extrabold text-slate-900">
                Users
              </h1>
              <p className="text-slate-500 mt-2">
                Manage students, teachers, and admins.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handlePrintSelected}
                disabled={selectedIds.length === 0}
                className="btn-secondary"
              >
                <PrinterIcon className="w-5 h-5" />
                Print {selectedIds.length > 0 ? `(${selectedIds.length})` : 'slips'}
              </button>
              <button onClick={() => setBulkOpen(true)} className="btn-secondary">
                <ArrowUpTrayIcon className="w-5 h-5" />
                Bulk import
              </button>
              <button onClick={() => setCreateOpen(true)} className="btn-primary">
                <UserPlusIcon className="w-5 h-5" />
                Register
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or exam number…"
                className="input pl-12"
              />
            </div>
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setRoleFilter(f.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    roleFilter === f.key
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selection toolbar */}
          {selectedIds.length > 0 && (
            <div className="mb-4 flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-3">
              <p className="text-sm text-brand-700">
                <strong>{selectedIds.length}</strong> selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintSelected}
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  Print slips
                </button>
                <span className="text-brand-300">·</span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <UserTable
            users={users}
            loading={loading}
            onToggleActive={handleToggleActive}
            onEdit={handleEdit}
            onResetPassword={handleReset}
            onDelete={handleEdit}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </main>
      </PageTransition>

      {/* Modals */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchUsers}
      />
      <BulkImportModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={fetchUsers}
      />
      <EditUserModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={currentUser}
        onUpdated={fetchUsers}
      />
      <ResetPasswordModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        user={currentUser}
      />
      <PrintSlipsModal
        open={printOpen}
        onClose={() => { setPrintOpen(false); setSelectedIds([]); }}
        users={selectedUsers}
      />
    </div>
  );
}