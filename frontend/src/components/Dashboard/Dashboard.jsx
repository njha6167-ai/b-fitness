import { useEffect, useState, useCallback } from "react";
import { Users, UserCheck, Clock, UserX } from "lucide-react";
import Header from "../Layout/Header";
import StatCard from "./StatCard";
import ExpiringSoonList from "./ExpiringSoonList";
import { getDashboardStats } from "../../api/client";

export default function Dashboard({ onSelectMember, refreshKey }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err?.response?.data?.error || err.message));
  }, []);

  useEffect(load, [load, refreshKey]);

  if (error) {
    return (
      <div className="rounded-lg border border-status-expired/30 bg-status-expiredBg p-4 text-sm text-status-expired">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <p className="text-sm text-gym-muted">Loading dashboard…</p>;
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Membership overview at a glance" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Members" value={stats.total} icon={Users} accent="gold" />
        <StatCard label="Active Members" value={stats.active} icon={UserCheck} accent="active" />
        <StatCard label="Expiring Soon" value={stats.expiring} icon={Clock} accent="expiring" />
        <StatCard label="Expired Members" value={stats.expired} icon={UserX} accent="expired" />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-xl tracking-wide text-gym-text">Expiring Soon</h2>
        <ExpiringSoonList members={stats.expiringSoonMembers} onSelectMember={onSelectMember} />
      </div>
    </div>
  );
}
