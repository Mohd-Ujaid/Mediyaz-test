/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { FileRef } from "@/features/donor-registration/validations/donor-registration";
import { SignatureCropperModal } from "./SignatureCropperModal";
import { InAppDocumentViewer } from "@/components/ui/in-app-document-viewer";

interface FileUploadFieldProps {
  label: string;
  value: FileRef;
  onChange: (file: FileRef) => void;
  accept?: string;
  required?: boolean;
  description?: string;
  folder?: string;
  enableCrop?: boolean;
  cropMode?: "signature" | "document" | "photo";
  error?: string;
}

export function FileUploadField({
  label,
  value,
  onChange,
  accept = ".pdf,.png,.jpg,.jpeg",
  required = false,
  description,
  folder = "documents",
  enableCrop = false,
  cropMode = "signature",
  error,
}: FileUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);

    // Delete existing file first to avoid orphaned duplicates
    if (value?.fileId) {
      try {
        await fetch(`/api/upload?fileId=${value.fileId}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Failed to delete old file before upload", err);
      }
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        onChange({
          fileId: data.media.fileId,
          url: data.media.url,
          name: data.media.fileName || file.name,
          type: data.media.type || file.type,
          fileName: data.media.fileName || file.name,
          folder: data.media.folder || folder,
          size: data.media.size || file.size,
        });
        toast.success(`${label} uploaded successfully`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Network error during upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (enableCrop && file.type.startsWith("image/")) {
      setOriginalFile(file);
      setCropperOpen(true);
    } else {
      await uploadFile(file);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropperOpen(false);
    await uploadFile(croppedFile);
  };

  const handleRemove = async () => {
    if (value?.fileId) {
      try {
        await fetch(`/api/upload?fileId=${value.fileId}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Failed to delete file from storage", err);
      }
    }
    onChange(null as any);
    toast.success(`${label} removed`);
  };

  const isImage = value?.type?.startsWith("image/");

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && (
        <p className="text-[10px] text-slate-400">{description}</p>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept={accept}
        className="hidden"
      />

      {value?.url ? (
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
          error 
            ? "border-red-500 bg-red-50/50 dark:bg-red-950/20" 
            : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
        }`}>
          {isImage ? (
            <img
              src={value.url}
              alt={value.name || value.fileName || "Uploaded Image"}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {value.name || value.fileName || "Uploaded File"}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              {uploading ? (
                <span className="text-blue-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading new file...
                </span>
              ) : (
                "Uploaded ✓"
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => !uploading && fileInputRef.current?.click()}
              disabled={uploading}
              className="h-8 text-xs px-2.5 rounded-lg border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer gap-1.5 font-medium shadow-2xs"
              title="Upload new file to replace"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Replace</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setViewerOpen(true)}
              className="h-8 w-8 p-0 rounded-lg cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              title="Preview Document"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleRemove}
              disabled={uploading}
              className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              title="Remove File"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            error 
              ? "border-red-500 hover:border-red-600 bg-red-500/5 text-red-600" 
              : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-blue-500 mx-auto animate-spin" />
          ) : (
            <Upload className={`w-6 h-6 mx-auto ${error ? "text-red-400" : "text-slate-400"}`} />
          )}
          <p className="text-xs font-medium text-slate-500 mt-2">
            {uploading ? "Uploading..." : `Click to upload ${label}`}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">PDF, JPG, PNG up to 10MB</p>
        </button>
      )}

      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}

      {cropperOpen && originalFile && (
        <SignatureCropperModal
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          file={originalFile}
          onCropComplete={handleCropComplete}
          mode={cropMode}
        />
      )}

      {value?.url && (
        <InAppDocumentViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          title={label}
          fileUrl={value.url}
          fileName={value.name}
        />
      )}
    </div>
  );
}
