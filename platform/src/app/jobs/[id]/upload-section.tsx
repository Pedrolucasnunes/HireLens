"use client";

import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload-zone";

export function UploadSection({ jobId }: { jobId: string }) {
  const router = useRouter();

  return (
    <UploadZone
      jobId={jobId}
      onUploadComplete={() => router.refresh()}
    />
  );
}
