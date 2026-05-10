"use client";

import React, { useCallback, useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface ImageUploadBoxProps {
  label: string;
  sublabel: string;
  value: string | null;
  /** Called with the final public HTTPS URL once upload completes.
   *  Also called immediately with a data: preview URL so the image
   *  appears without waiting for the server round-trip. */
  onChange: (url: string) => void;
  onClear: () => void;
  /** Whether the upload is still in progress (parent can gate the generate button) */
  onUploadingChange?: (uploading: boolean) => void;
  height?: string;
}

export function ImageUploadBox({
  label,
  sublabel,
  value,
  onChange,
  onClear,
  onUploadingChange,
  height = "h-72",
}: ImageUploadBoxProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read a file as a base64 data URL
  const readDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const r = e.target?.result;
        if (typeof r === "string") resolve(r);
        else reject(new Error("FileReader failed"));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const setUploading = (v: boolean) => {
    setIsUploading(v);
    onUploadingChange?.(v);
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;

      // ── 1. Show preview immediately via data URL ────────────────────────
      let dataUrl: string;
      try {
        dataUrl = await readDataUrl(file);
      } catch {
        return;
      }
      onChange(dataUrl);
      setUploading(true);

      try {
        // ── 2a. Try /api/upload (requires auth Bearer token) ───────────────
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: fd,
          });
          if (res.ok) {
            const j = (await res.json()) as { url?: string };
            if (j.url) {
              onChange(j.url);
              return;
            }
          }
        }

        // ── 2b. Fallback: upload directly to Supabase Storage ──────────────
        //   Uses the public "avatars" bucket (anon key is enough for upload).
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `studio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, file, { contentType: file.type, upsert: true });

        if (!upErr) {
          const { data: pub } = supabase.storage
            .from("avatars")
            .getPublicUrl(path);
          if (pub?.publicUrl) {
            onChange(pub.publicUrl);
            return;
          }
        }

        // ── 2c. Last resort: keep the data: URL ───────────────────────────
        // The data: URL is already set from step 1, nothing to do.
        // route.ts will try to re-upload it server-side from its own storage.
        console.warn("[ImageUploadBox] All upload paths failed — using data: URL");
      } catch {
        // non-fatal — data: URL from step 1 is already in place
      } finally {
        setUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, onUploadingChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <p className="text-foreground/60 text-xs font-medium uppercase tracking-wider">
        {label}
      </p>

      <div
        className={`relative w-full ${height} rounded-2xl border-2 border-dashed
          transition-all duration-200 overflow-hidden
          ${
            isDragOver
              ? "border-[#4A6741]/40 bg-[#4A6741]/5"
              : value
              ? "border-slate-200 bg-white cursor-default"
              : "border-slate-200 bg-white hover:border-[#4A6741]/40 cursor-pointer"
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !value && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
        />

        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />

            {/* Uploading spinner */}
            {isUploading && (
              <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                <Loader2 className="w-8 h-8 text-[#4A6741] animate-spin" />
                <p className="text-foreground/60 text-xs">Uploading…</p>
              </div>
            )}

            {/* Clear button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-white transition-all z-10 shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-foreground/40" />
            </div>
            <div>
              <p className="text-foreground/70 text-sm font-medium">{label}</p>
              <p className="text-foreground/30 text-xs mt-1">{sublabel}</p>
            </div>
            <p className="text-foreground/20 text-xs font-medium">Drag &amp; drop or click to browse</p>
          </div>
        )}

        {isDragOver && (
          <div className="absolute inset-0 bg-[#bef264]/10 border-2 border-[#bef264]/50 rounded-2xl flex items-center justify-center pointer-events-none">
            <UploadCloud className="w-10 h-10 text-[#bef264]" />
          </div>
        )}
      </div>
    </div>
  );
}
