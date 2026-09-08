"use client";

import { useCallback, useEffect, useState } from "react";

type Lead = {
  id: string;
  public_number: string;
  name: string;
  phone_normalized: string;
  category_snapshot: string;
  message: string | null;
  status: string;
  created_at: number;
  attachments?: Array<{
    id: string;
    original_name: string;
    mime: string;
    bytes: number;
    created_at: number;
    download_url: string;
  }>;
};

const statuses = ["NEW", "IN_PROGRESS", "CONTACTED", "CLOSED", "SPAM"];

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/v1/admin/leads?limit=100", { headers: { Accept: "application/json" } });
      const payload = await response.json() as { ok?: boolean; leads?: Lead[] };
      if (!response.ok || !payload.ok || !payload.leads) {
        setState(response.status === 404 || response.status === 503 ? "unavailable" : "error");
        return;
      }
      setLeads(payload.leads);
      setState("ready");
    } catch {
      setState("unavailable");
    }
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void load());
    return () => window.cancelAnimationFrame(frame);
  }, [load]);

  async function updateStatus(lead: Lead, status: string) {
    const response = await fetch(`/api/v1/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) { setState("error"); return; }
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status } : item));
  }

  if (state === "loading") return <div className="admin-state">Завантажуємо заявки…</div>;
  if (state === "unavailable") return <div className="admin-state"><b>API заявок не підключений</b><p>Після підключення Cloudflare Worker, D1 і Access ця сторінка покаже реальні заявки.</p></div>;
  if (state === "error") return <div className="admin-state"><b>Дані не підтверджені</b><p>Сталася помилка. Адмінка не показує застарілий стан як успішний.</p><button type="button" onClick={() => void load()}>Спробувати ще раз</button></div>;
  if (leads.length === 0) return <div className="admin-state">Заявок поки немає.</div>;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Номер</th><th>Контакт</th><th>Інтерес</th><th>Вкладення</th><th>Створено</th><th>Статус</th></tr></thead>
        <tbody>{leads.map((lead) => <tr key={lead.id}><td><b>{lead.public_number}</b></td><td>{lead.name}<a href={`tel:${lead.phone_normalized}`}>{lead.phone_normalized}</a></td><td>{lead.category_snapshot}{lead.message && <small>{lead.message}</small>}</td><td>{lead.attachments?.length ? <ul className="admin-attachment-list">{lead.attachments.map((attachment) => <li key={attachment.id}><a href={attachment.download_url} download>{attachment.original_name}</a><small>{formatBytes(attachment.bytes)}</small></li>)}</ul> : <span>—</span>}</td><td>{new Date(lead.created_at).toLocaleString("uk-UA")}</td><td><select value={lead.status} onChange={(event) => void updateStatus(lead, event.target.value)}>{statuses.map((status) => <option value={status} key={status}>{status}</option>)}</select></td></tr>)}</tbody>
      </table>
    </div>
  );
}
