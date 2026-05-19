"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  jobId: string;
  onUploadComplete: () => void;
}

export function UploadZone({ jobId, onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<{ name: string; status: "uploading" | "done" | "error" }[]>([]);

  const processFiles = useCallback(
    async (files: File[]) => {
      const pdfs = files.filter((f) => f.type === "application/pdf");
      if (!pdfs.length) return;

      const newUploads = pdfs.map((f) => ({ name: f.name, status: "uploading" as const }));
      setUploads((prev) => [...prev, ...newUploads]);

      await Promise.all(
        pdfs.map(async (file, i) => {
          const form = new FormData();
          form.append("file", file);
          form.append("job_id", jobId);

          try {
            const res = await fetch("/api/analyze", { method: "POST", body: form });
            const status = res.ok ? "done" : "error";
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === prev.length - pdfs.length + i ? { ...u, status } : u
              )
            );
          } catch {
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === prev.length - pdfs.length + i ? { ...u, status: "error" } : u
              )
            );
          }
        })
      );

      onUploadComplete();
    },
    [jobId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <p className="text-sm text-muted-foreground mb-3">
          Arraste os currículos (PDF) aqui ou
        </p>
        <label htmlFor="file-input">
          <Button variant="outline" size="sm" asChild>
            <span className="cursor-pointer">Selecionar arquivos</span>
          </Button>
        </label>
        <input
          id="file-input"
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <p className="text-xs text-muted-foreground mt-2">Somente PDF</p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-1">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  u.status === "uploading" && "bg-amber-400 animate-pulse",
                  u.status === "done" && "bg-emerald-500",
                  u.status === "error" && "bg-destructive"
                )}
              />
              <span className="truncate text-muted-foreground">{u.name}</span>
              <span className="text-xs shrink-0">
                {u.status === "uploading" && "Analisando..."}
                {u.status === "done" && "Concluído"}
                {u.status === "error" && "Erro"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
