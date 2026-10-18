"use client";

import React, { useState } from "react";
import { SampleDocument } from "../types/api";
import { apiClient } from "../lib/apiClient";
import { X, FileUp, Check } from "lucide-react";

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  sampleDocuments: SampleDocument[];
  onIngestionSuccess: () => void;
}

export function IngestionModal({
  isOpen,
  onClose,
  tenantId,
  sampleDocuments,
  onIngestionSuccess,
}: IngestionModalProps) {
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("markdown");
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    nodes: number;
    edges: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectSample = (sample: SampleDocument) => {
    setTitle(sample.title);
    setDocType(sample.doc_type);
    setRawText(sample.raw_text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !rawText.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.ingestDocument(tenantId, {
        title,
        doc_type: docType,
        raw_text: rawText,
      });
      setSuccessResult({
        nodes: res.nodes_created,
        edges: res.edges_created,
      });
      onIngestionSuccess();
      setTimeout(() => {
        setSuccessResult(null);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-lg shadow-2xl p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold">
            <FileUp className="w-4 h-4 text-emerald-600" />
            <span className="uppercase tracking-wider">
              Schema-Enforced Document Ingestion
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sample Docs quick-populate buttons */}
        {sampleDocuments.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">
              Load Tenant Template
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleDocuments.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-400 text-slate-700 text-[11px] font-medium px-2.5 py-1 rounded transition shadow-xs"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* File Upload Dropzone */}
          <label
            htmlFor="modal-file-upload-input"
            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/20 rounded-lg p-4 cursor-pointer transition text-center group"
          >
            <FileUp className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition mb-1" />
            <span className="text-xs font-medium text-slate-700 group-hover:text-emerald-700">
              Select or drop specification file (.md, .txt, .json)
            </span>
            <input
              id="modal-file-upload-input"
              type="file"
              accept=".md,.markdown,.txt,.json,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setTitle(file.name);
                  const ext = file.name.split(".").pop()?.toLowerCase() || "md";
                  if (["md", "markdown"].includes(ext)) setDocType("markdown");
                  else if (ext === "json") setDocType("json");
                  else if (ext === "csv") setDocType("csv");
                  else setDocType("txt");

                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    setRawText(text || "");
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 01_orbitguard_aerospace.md"
                required
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-500 shadow-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-slate-500 font-semibold">Doc Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-500 shadow-xs"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="txt">Text (.txt)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-semibold">File Content Preview</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={4}
              placeholder="Loaded file text will appear here..."
              required
              className="w-full bg-white border border-slate-300 rounded p-2.5 text-slate-800 focus:outline-none focus:border-slate-500 font-mono text-xs shadow-xs"
            />
          </div>

          {error && (
            <div className="text-rose-700 text-xs bg-rose-50 border border-rose-200 p-2 rounded">
              {error}
            </div>
          )}

          {successResult && (
            <div className="text-emerald-800 text-xs bg-emerald-50 border border-emerald-200 p-2 rounded flex items-center space-x-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>
                Ingestion complete. Extracted {successResult.nodes} nodes and {successResult.edges} relationships into FalkorDB.
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded transition flex items-center space-x-1.5 font-medium shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Compiling..." : "Ingest Document"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
