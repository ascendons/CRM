"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { driveApi } from "@/lib/drive";
import { showToast } from "@/lib/toast";

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [file, setFile] = useState<any>(null);

  useEffect(() => {
    driveApi.downloadFile(id).then(res => setDownloadUrl(res.data)).catch(() => {});
    driveApi.getVersions(id).then(res => setVersions(res.data || [])).catch(() => {});
    // get file info from list (simplified)
    driveApi.getFiles().then(res => {
      const found = (res.data || []).find((f: any) => f.fileId === id);
      setFile(found);
    }).catch(() => {});
  }, [id]);

  const isImage = file?.mimeType?.startsWith("image/");
  const isPdf = file?.mimeType === "application/pdf";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{file?.name || "File"}</h1>
      <div className="bg-white border rounded-xl p-4 mb-4">
        {isImage && downloadUrl && <img src={downloadUrl} alt={file?.name} className="max-w-full max-h-96 mx-auto rounded" />}
        {isPdf && downloadUrl && <iframe src={downloadUrl} className="w-full h-[600px] rounded" title={file?.name} />}
        {!isImage && !isPdf && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-400">description</span>
            <p className="text-slate-500 mt-2">{file?.name}</p>
          </div>
        )}
      </div>

      {downloadUrl && (
        <a href={downloadUrl} download={file?.name} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg mb-6">
          <span className="material-symbols-outlined text-sm">download</span> Download
        </a>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Version History</h2>
        {versions.map((v: any) => (
          <div key={v.versionId} className="bg-white border rounded-lg p-3 mb-2 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Version {v.versionNumber}</p>
              <p className="text-xs text-slate-500">Uploaded by {v.uploadedBy} · {v.uploadedAt?.substring(0, 10)}</p>
            </div>
            <span className="text-xs text-slate-400">{v.sizeBytes ? `${(v.sizeBytes / 1024).toFixed(1)} KB` : ""}</span>
          </div>
        ))}
        {versions.length === 0 && <p className="text-slate-400 text-sm">No version history.</p>}
      </div>
    </div>
  );
}
