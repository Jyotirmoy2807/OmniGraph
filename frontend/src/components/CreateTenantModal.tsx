"use client";

import React, { useState } from "react";
import { X, Plus } from "lucide-react";

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTenant: (id: string, name: string, industry: string, description: string) => Promise<void>;
}

export function CreateTenantModal({ isOpen, onClose, onCreateTenant }: CreateTenantModalProps) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateTenant(id.trim(), name.trim(), industry.trim(), description.trim());
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-2xl p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold">
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="uppercase tracking-wider">Provision New Enterprise Tenant</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-semibold">Tenant Identifier (Slug)</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="e.g. logistics_corp"
              required
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-500 font-mono shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-semibold">Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Global Freight & Supply"
              required
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-500 shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-semibold">Industry / Sector</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Maritime Supply Chain"
              className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-500 shadow-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase text-slate-500 font-semibold">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="High-level operational overview..."
              rows={2}
              className="w-full bg-white border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:border-slate-500 shadow-xs"
            />
          </div>

          {error && (
            <div className="text-rose-700 text-xs bg-rose-50 border border-rose-200 p-2 rounded">
              {error}
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded transition flex items-center space-x-1.5 font-medium shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Provisioning..." : "Create Tenant"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
