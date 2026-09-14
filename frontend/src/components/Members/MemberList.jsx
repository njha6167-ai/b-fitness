import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import Header from "../Layout/Header";
import SearchBar from "./SearchBar";
import MemberCard from "./MemberCard";
import MemberForm from "./MemberForm";
import Modal from "../shared/Modal";
import ConfirmDialog from "../shared/ConfirmDialog";
import { getMembers, createMember, updateMember, deleteMember } from "../../api/client";

export default function MemberList({ onSelectMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getMembers()
      .then((data) => {
        setMembers(data);
        setError(null);
      })
      .catch((err) => setError(err?.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // Instant client-side search across name + mobile number.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.phone.toLowerCase().includes(q));
  }, [members, search]);

  async function handleAdd(formData) {
    await createMember(formData);
    setShowAddForm(false);
    load();
  }

  async function handleEdit(formData) {
    await updateMember(editingMember._id, formData);
    setEditingMember(null);
    load();
  }

  async function handleDelete() {
    await deleteMember(deletingMember._id);
    setDeletingMember(null);
    load();
  }

  return (
    <div>
      <Header
        title="Members"
        subtitle={`${members.length} total`}
        action={
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-gym-gold px-4 py-2 text-sm font-semibold text-gym-bg hover:bg-gym-gold/90"
          >
            <Plus size={16} /> Add Member
          </button>
        }
      />

      <div className="mb-5">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-status-expired/30 bg-status-expiredBg px-3 py-2 text-sm text-status-expired">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gym-muted">Loading members…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-gym-border bg-gym-panel p-10 text-center text-sm text-gym-muted">
          {search ? "No members match your search." : "No members yet. Add your first member to get started."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <MemberCard
              key={m._id}
              member={m}
              onSelect={onSelectMember}
              onEdit={setEditingMember}
              onDelete={setDeletingMember}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <Modal title="Add Member" onClose={() => setShowAddForm(false)}>
          <MemberForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} submitLabel="Add Member" />
        </Modal>
      )}

      {editingMember && (
        <Modal title="Edit Member" onClose={() => setEditingMember(null)}>
          <MemberForm
            initialData={editingMember}
            onSubmit={handleEdit}
            onCancel={() => setEditingMember(null)}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {deletingMember && (
        <ConfirmDialog
          title="Delete Member"
          message={`Remove ${deletingMember.name} and their full reminder history? This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeletingMember(null)}
        />
      )}
    </div>
  );
}
