"use client";
import { useEffect, useRef, useState } from "react";
import { driveApi } from "@/lib/drive";
import { showToast } from "@/lib/toast";

export default function DrivePage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [breadcrumb, setBreadcrumb] = useState<{ id?: string; name: string }[]>([
    { name: "Drive" },
  ]);
  const [dragging, setDragging] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, [currentFolderId]);

  async function load() {
    try {
      const [fRes, fileRes] = await Promise.all([
        driveApi.getFolders(currentFolderId),
        driveApi.getFiles(currentFolderId),
      ]);
      setFolders(fRes.data || []);
      setFiles(fileRes.data || []);
    } catch {
      showToast.error("Failed to load");
    }
  }

  function navigate(folder: any) {
    setCurrentFolderId(folder.folderId);
    setBreadcrumb([...breadcrumb, { id: folder.folderId, name: folder.name }]);
  }

  function navigateTo(index: number) {
    const item = breadcrumb[index];
    setBreadcrumb(breadcrumb.slice(0, index + 1));
    setCurrentFolderId(item.id);
  }

  async function handleCreateFolder() {
    if (!newFolder.trim()) return;
    try {
      await driveApi.createFolder({ name: newFolder, parentFolderId: currentFolderId });
      setNewFolder("");
      showToast.success("Folder created");
      load();
    } catch {
      showToast.error("Failed");
    }
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    for (const f of Array.from(fileList)) {
      try {
        await driveApi.uploadFile(f, currentFolderId);
        showToast.success(`Uploaded ${f.name}`);
      } catch {
        showToast.error(`Failed to upload ${f.name}`);
      }
    }
    load();
  }

  async function handleDelete(fileId: string) {
    if (!confirm("Delete file?")) return;
    try {
      await driveApi.deleteFile(fileId);
      showToast.success("Deleted");
      load();
    } catch {
      showToast.error("Failed");
    }
  }

  function fileIcon(mime?: string) {
    if (!mime) return "description";
    if (mime.startsWith("image/")) return "image";
    if (mime === "application/pdf") return "picture_as_pdf";
    if (mime.includes("video")) return "movie";
    if (mime.includes("spreadsheet") || mime.includes("excel")) return "table_chart";
    return "description";
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Document Drive</h1>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 mb-4 text-sm">
        {breadcrumb.map((b, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-400">/</span>}
            <button
              onClick={() => navigateTo(i)}
              className={
                i === breadcrumb.length - 1
                  ? "font-semibold text-primary"
                  : "text-slate-500 hover:text-primary"
              }
            >
              {b.name}
            </button>
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <input
          className="border rounded-lg px-3 py-2 text-sm"
          placeholder="New folder name"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
        />
        <button
          onClick={handleCreateFolder}
          className="bg-slate-100 border px-3 py-2 rounded-lg text-sm"
        >
          Create Folder
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">upload</span> Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 mb-4 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-slate-200"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleUpload(e.dataTransfer.files);
        }}
      >
        <span className="material-symbols-outlined text-3xl text-slate-400">cloud_upload</span>
        <p className="text-slate-500 text-sm mt-1">Drag and drop files here</p>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Folders</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {folders.map((f: any) => (
              <button
                key={f.folderId}
                onClick={() => navigate(f)}
                className="bg-white border rounded-xl p-4 flex items-center gap-3 hover:border-primary transition-colors text-left"
              >
                <span className="material-symbols-outlined text-amber-500">folder</span>
                <span className="text-sm font-medium truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Files</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {files.map((f: any) => (
              <div key={f.fileId} className="bg-white border rounded-xl p-4 group relative">
                <a href={`/drive/files/${f.fileId}`} className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-4xl text-blue-500">
                    {fileIcon(f.mimeType)}
                  </span>
                  <p className="text-sm font-medium text-center truncate w-full">{f.name}</p>
                  <p className="text-xs text-slate-400">
                    {f.sizeBytes ? `${(f.sizeBytes / 1024).toFixed(1)} KB` : ""}
                  </p>
                </a>
                <button
                  onClick={() => handleDelete(f.fileId)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {folders.length === 0 && files.length === 0 && (
        <p className="text-center text-slate-400 py-12">This folder is empty.</p>
      )}
    </div>
  );
}
