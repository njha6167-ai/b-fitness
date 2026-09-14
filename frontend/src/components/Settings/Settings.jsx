import { useEffect, useState, useCallback } from "react";
import { Plus, X, CheckCircle2, AlertCircle, PlayCircle, Save } from "lucide-react";
import Header from "../Layout/Header";
import { getSettings, updateSettings, getWhatsappStatus, runReminderCheck } from "../../api/client";
import { fillTemplate } from "../../utils/whatsappMessage";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [waStatus, setWaStatus] = useState(null);
  const [newDay, setNewDay] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(() => {
    getSettings().then(setSettings).catch((err) => setError(err?.response?.data?.error || err.message));
    getWhatsappStatus().then(setWaStatus).catch(() => setWaStatus({ configured: false }));
  }, []);

  useEffect(load, [load]);

  function addDay() {
    const n = Number(newDay);
    if (!Number.isFinite(n) || n < 0) return;
    if (settings.reminderDays.includes(n)) {
      setNewDay("");
      return;
    }
    setSettings((s) => ({ ...s, reminderDays: [...s.reminderDays, n].sort((a, b) => b - a) }));
    setNewDay("");
  }

  function removeDay(n) {
    setSettings((s) => ({ ...s, reminderDays: s.reminderDays.filter((d) => d !== n) }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateSettings({
        gymName: settings.gymName,
        reminderDays: settings.reminderDays,
        expiringSoonThresholdDays: Number(settings.expiringSoonThresholdDays),
        messageTemplate: settings.messageTemplate,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTestRun() {
    setTesting(true);
    setTestResult(null);
    try {
      const summary = await runReminderCheck();
      setTestResult(summary);
    } catch (err) {
      setTestResult({ error: err?.response?.data?.error || err.message });
    } finally {
      setTesting(false);
    }
  }

  if (!settings) {
    return error ? (
      <div className="rounded-md border border-status-expired/30 bg-status-expiredBg px-3 py-2 text-sm text-status-expired">
        {error}
      </div>
    ) : (
      <p className="text-sm text-gym-muted">Loading settings…</p>
    );
  }

  const preview = fillTemplate(settings.messageTemplate, {
    memberName: "Rahul",
    expiryDate: "20 September 2026",
    gymName: settings.gymName,
  });

  return (
    <div className="max-w-3xl">
      <Header title="Settings" subtitle="Reminder schedule, message template & WhatsApp status" />

      {error && (
        <div className="mb-5 rounded-md border border-status-expired/30 bg-status-expiredBg px-3 py-2 text-sm text-status-expired">
          {error}
        </div>
      )}

      {/* WhatsApp connection status */}
      <section className="mb-6 rounded-lg border border-gym-border bg-gym-panel p-6">
        <h3 className="mb-3 font-display text-xl tracking-wide text-gym-text">WhatsApp Business API</h3>
        {waStatus?.configured ? (
          <div className="flex items-start gap-2 rounded-md border border-status-active/30 bg-status-activeBg px-3 py-2 text-sm text-status-active">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              Cloud API credentials detected. Reminders are sent automatically through the WhatsApp Business
              Cloud API.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-status-expiring/30 bg-status-expiringBg px-3 py-2 text-sm text-status-expiring">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              No API credentials found. "Send WhatsApp" buttons will open a pre-filled WhatsApp chat for you to
              send manually. To enable fully automatic sending, add <code>WHATSAPP_ACCESS_TOKEN</code>,{" "}
              <code>WHATSAPP_PHONE_NUMBER_ID</code> and <code>WHATSAPP_BUSINESS_ACCOUNT_ID</code> to{" "}
              <code>backend/.env</code> and restart the server.
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleTestRun}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-md border border-gym-border px-3 py-2 text-sm font-medium text-gym-text hover:bg-gym-panel2 disabled:opacity-60"
          >
            <PlayCircle size={16} /> {testing ? "Running…" : "Run reminder check now"}
          </button>
          <span className="text-xs text-gym-muted">
            Normally runs automatically once a day. Use this to test it right now.
          </span>
        </div>

        {testResult && (
          <div className="mt-3 rounded-md border border-gym-border bg-gym-panel2/60 px-3 py-2 text-xs text-gym-muted">
            {testResult.error ? (
              <span className="text-status-expired">{testResult.error}</span>
            ) : (
              <>
                Checked {testResult.checked} members · {testResult.dueToday} due today · {testResult.sent} sent ·{" "}
                {testResult.queued} queued for manual send · {testResult.failed} failed · {testResult.skipped}{" "}
                already handled
              </>
            )}
          </div>
        )}
      </section>

      {/* Reminder days */}
      <section className="mb-6 rounded-lg border border-gym-border bg-gym-panel p-6">
        <h3 className="font-display text-xl tracking-wide text-gym-text">Reminder Schedule</h3>
        <p className="mt-1 mb-4 text-sm text-gym-muted">
          Days before expiry to send a reminder. Use 0 for the expiry day itself.
        </p>
        <div className="flex flex-wrap gap-2">
          {settings.reminderDays
            .slice()
            .sort((a, b) => b - a)
            .map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-2 rounded-full border border-gym-gold/30 bg-gym-gold/10 px-3 py-1.5 text-sm font-medium text-gym-gold"
              >
                {d === 0 ? "On expiry day" : `${d} day${d === 1 ? "" : "s"} before`}
                <button onClick={() => removeDay(d)} className="hover:text-status-expired">
                  <X size={14} />
                </button>
              </span>
            ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={newDay}
            onChange={(e) => setNewDay(e.target.value)}
            placeholder="e.g. 14"
            className="input max-w-[140px]"
          />
          <button
            onClick={addDay}
            className="inline-flex items-center gap-1 rounded-md border border-gym-border px-3 py-2 text-sm font-medium text-gym-text hover:bg-gym-panel2"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        <label className="mt-5 block max-w-xs">
          <span className="mb-1.5 block text-sm font-medium text-gym-text">"Expiring Soon" threshold (days)</span>
          <input
            type="number"
            min="0"
            value={settings.expiringSoonThresholdDays}
            onChange={(e) => setSettings((s) => ({ ...s, expiringSoonThresholdDays: e.target.value }))}
            className="input"
          />
          <span className="mt-1 block text-xs text-gym-muted">
            Members inside this window show the yellow "Expiring Soon" status.
          </span>
        </label>
      </section>

      {/* Message template */}
      <section className="mb-6 rounded-lg border border-gym-border bg-gym-panel p-6">
        <h3 className="font-display text-xl tracking-wide text-gym-text">Message Template</h3>
        <p className="mt-1 mb-4 text-sm text-gym-muted">
          Use <code>{"{memberName}"}</code>, <code>{"{expiryDate}"}</code> and <code>{"{gymName}"}</code> — they're
          replaced automatically.
        </p>
        <textarea
          value={settings.messageTemplate}
          onChange={(e) => setSettings((s) => ({ ...s, messageTemplate: e.target.value }))}
          className="input min-h-[160px] resize-y font-mono text-xs"
        />

        <p className="mb-1.5 mt-4 text-sm font-medium text-gym-text">Live preview</p>
        <div className="whitespace-pre-wrap rounded-md border border-gym-border bg-gym-panel2/60 px-3 py-2 text-sm text-gym-text">
          {preview}
        </div>
      </section>

      <label className="mb-6 block max-w-sm">
        <span className="mb-1.5 block text-sm font-medium text-gym-text">Gym Name</span>
        <input
          value={settings.gymName}
          onChange={(e) => setSettings((s) => ({ ...s, gymName: e.target.value }))}
          className="input"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-gym-gold px-4 py-2 text-sm font-semibold text-gym-bg hover:bg-gym-gold/90 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && <span className="text-sm text-status-active">Saved</span>}
      </div>
    </div>
  );
}
