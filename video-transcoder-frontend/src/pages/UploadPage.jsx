import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../api/videoApi";

function UploadPage() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileSelect = (selectedFile) => {
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files[0]);
  };

  // Real upload — will work once the Spring Boot backend is running on
  // the URL set in .env (VITE_API_BASE_URL).
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = await uploadVideo(file, setProgress);
      navigate(`/preview/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
      setUploading(false);
    }
  };

  // DEMO MODE — lets you see the full Preview page UI right now, without
  // needing the backend to exist yet. Plays your actual selected file
  // directly from your computer (no internet/backend dependency at all).
  // Remove this button once the real backend is connected and tested.
  const handlePreviewDemo = () => {
    if (!file) return;
    navigate("/preview/demo", { state: { file } });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-blue-400 text-2xl font-semibold">
        Put your video here
      </h1>

      <div
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full max-w-2xl h-64 border-2 border-dashed border-slate-500 rounded-xl bg-slate-600/40 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-600/60 transition"
      >
        <p className="text-white text-2xl font-bold">Drag and Drop</p>
        <p className="text-slate-200 text-sm mt-2">click to add the file</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
      </div>

      {file && (
        <div className="text-center text-white">
          <p>{file.name}</p>
          <p className="text-slate-400 text-sm">{file.size} bytes</p>
        </div>
      )}

      {error && <p className="text-red-400">{error}</p>}

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-6 py-2 rounded-lg border border-white text-white disabled:opacity-40 hover:bg-white hover:text-slate-900 transition"
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </button>

        <button
          onClick={handlePreviewDemo}
          disabled={!file}
          className="px-6 py-2 rounded-lg border border-yellow-400 text-yellow-400 disabled:opacity-40 hover:bg-yellow-400 hover:text-slate-900 transition"
        >
          Preview UI (Demo Mode — No Backend Needed)
        </button>
      </div>

      {uploading && (
        <div className="w-full max-w-2xl bg-slate-700 rounded-full h-6 overflow-hidden">
          <div
            className="bg-indigo-500 h-full flex items-center justify-center text-xs text-white transition-all"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;