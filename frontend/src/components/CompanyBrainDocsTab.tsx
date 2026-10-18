"use client";

import React, { useState } from "react";
import {
  SampleDocument,
  OntologyMetadataResponse,
  GraphDataResponse,
} from "../types/api";
import { apiClient } from "../lib/apiClient";
import { FileUp, FileText, Check, Layers, Sparkles } from "lucide-react";

interface CompanyBrainDocsTabProps {
  tenantId: string;
  sampleDocuments: SampleDocument[];
  ontology: OntologyMetadataResponse | null;
  graphData: GraphDataResponse | null;
  onIngestionSuccess: () => void;
}

export function CompanyBrainDocsTab({
  tenantId,
  sampleDocuments,
  ontology,
  graphData,
  onIngestionSuccess,
}: CompanyBrainDocsTabProps) {
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("markdown");
  const [rawText, setRawText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    nodes: number;
    edges: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      }, 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find all (:Document) nodes in tenant graph
  const documentNodes = (graphData?.nodes || []).filter(
    (n) => n.label === "Document"
  );

  return (
    <div className="grid grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] overflow-y-auto font-sans">
      {/* Left Column (6 Cols): Document Ingestion Form */}
      <div className="col-span-6 flex flex-col gap-4 pr-2">
        <div>
          <div className="flex items-center space-x-2">
            <FileUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              Schema-Enforced Document Ingestion Studio
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload operational specifications, runbooks, or rosters. The LLM extracts entities and compiles parameterized MERGE queries linking nodes to source document provenance (Track 3: Company Brain).
          </p>
        </div>

        {/* 1-Click Sample Document Loader */}
        {sampleDocuments.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              1-Click Enterprise Templates ({tenantId})
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleDocuments.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-400 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg transition shadow-2xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ingestion Form with File Upload & Dropzone */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs"
        >
          {/* File Upload Dropzone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Select or Drop Specification File (.md, .txt, .json)
            </label>
            <label
              htmlFor="file-upload-input"
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-xl p-6 cursor-pointer transition text-center group"
            >
              <FileUp className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition mb-2" />
              <span className="text-xs font-medium text-slate-800 group-hover:text-emerald-700">
                Click to browse or drag and drop your file here
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Markdown, plain text, or JSON specifications (e.g. from /samples)
              </span>
              <input
                id="file-upload-input"
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
          </div>

          {/* Document metadata display/override */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 01_orbitguard_aerospace.md"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Format
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs font-medium"
              >
                <option value="markdown">Markdown (.md)</option>
                <option value="txt">Text (.txt)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="json">JSON (.json)</option>
              </select>
            </div>
          </div>

          {/* Collapsible/Previewable File Content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-600">
                File Content Preview
              </label>
              {rawText && (
                <span className="text-[10px] text-slate-500 font-mono">
                  {rawText.length} characters loaded
                </span>
              )}
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              placeholder="Loaded file content will appear here..."
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono shadow-2xs leading-relaxed"
            />
          </div>

          {error && (
            <div className="text-rose-700 text-xs bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          {successResult && (
            <div className="text-emerald-800 text-xs bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Ingestion complete. Extracted {successResult.nodes} nodes and {successResult.edges} relationships into FalkorDB.
              </span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !rawText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium px-4 py-2 rounded-lg transition flex items-center space-x-2 shadow-2xs cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Compiling into FalkorDB..." : "Compile into FalkorDB"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Right Column (6 Cols): Ingested Documents & Ontology Schema Reference */}
      <div className="col-span-6 flex flex-col gap-4 pl-2">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              Ingested Source Documents ({documentNodes.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Origin documents verified with [:SOURCED_FROM] provenance links inside the FalkorDB tenant namespace.
          </p>
        </div>

        {/* Source Documents List */}
        <div className="space-y-2">
          {documentNodes.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-400 italic">
              No documents ingested yet for this tenant. Load a template or paste text on the left to ingest.
            </div>
          ) : (
            documentNodes.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{doc.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                    {String(doc.properties?.doc_type || "DOCUMENT")}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Node ID: {doc.id}
                </div>
                {doc.properties?.uploaded_at && (
                  <div className="text-[10px] text-slate-400 font-mono">
                    Uploaded: {String(doc.properties.uploaded_at)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Universal Ontology Schema Reference Card */}
        {ontology && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs mt-2">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Universal Enterprise Ontology Reference
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {ontology.node_labels.map((lbl) => (
                <div
                  key={lbl.label}
                  className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1"
                  style={{ borderLeftWidth: "3px", borderLeftColor: lbl.color }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">
                      {lbl.label}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: lbl.color }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {lbl.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-1">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
                Standardized Relationships
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ontology.relation_types.map((r) => (
                  <span
                    key={r}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
