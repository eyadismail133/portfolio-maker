"use client";

import { useCallback, useEffect, useState } from "react";
import { friendlyError } from "@/lib/portfolios";
import { listVersions, loadVersion, saveVersion, type Version } from "@/lib/publishing";
import { useEditor } from "./store";
import { Label, PanelHeading, buttonClass, inputClass } from "./ui";

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Saved copies of the portfolio. Restoring one is a normal change, so Undo brings the current page back. */
export function VersionsPanel({ portfolioId }: { portfolioId: string }) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const plan = useEditor((s) => s.plan);

  const refresh = useCallback(() => {
    listVersions(portfolioId)
      .then(setVersions)
      .catch((error) => {
        setVersions([]);
        setNote(friendlyError(error));
      });
  }, [portfolioId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = async () => {
    const doc = useEditor.getState().doc;
    if (!doc) return;
    setBusy("save");
    setNote("");
    try {
      await saveVersion(portfolioId, doc, label || "Saved by hand");
      setLabel("");
      refresh();
    } catch (error) {
      setNote(friendlyError(error));
    } finally {
      setBusy("");
    }
  };

  const restore = async (version: Version) => {
    setBusy(version.id);
    setNote("");
    try {
      useEditor.getState().commit(await loadVersion(version.id));
      setNote(`Restored the version from ${when(version.createdAt)}. Use Undo to go back.`);
    } catch (error) {
      setNote(friendlyError(error));
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="grid gap-3">
      <PanelHeading>Version history</PanelHeading>
      <div className="grid gap-1">
        <Label htmlFor="version-label">Name for this version (optional)</Label>
        <div className="flex gap-2">
          <input
            id="version-label"
            className={inputClass}
            dir="auto"
            maxLength={80}
            placeholder="Before the redesign"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button
            type="button"
            className={`${buttonClass} shrink-0`}
            disabled={busy === "save"}
            onClick={save}
          >
            {busy === "save" ? "Saving…" : "Save version"}
          </button>
        </div>
      </div>
      {note && (
        <p role="status" className="text-xs text-zinc-600 dark:text-zinc-400">
          {note}
        </p>
      )}
      {versions === null ? (
        <p className="text-xs text-zinc-500">Loading versions…</p>
      ) : versions.length === 0 ? (
        <p className="text-xs text-zinc-500">
          No versions yet. Each publish saves one, and you can save one by hand.
        </p>
      ) : (
        <ul className="grid gap-1">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-2.5 py-1.5 dark:border-zinc-800"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium" dir="auto">
                  {version.label || "Saved version"}
                </span>
                <span className="block text-xs text-zinc-500">{when(version.createdAt)}</span>
              </span>
              <button
                type="button"
                className={buttonClass}
                disabled={busy !== ""}
                onClick={() => restore(version)}
              >
                {busy === version.id ? "Restoring…" : "Restore"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-zinc-500">
        {plan === "pro"
          ? "The newest 30 versions are kept."
          : "The newest 5 versions are kept on Free, 30 on Pro."}
      </p>
    </div>
  );
}
