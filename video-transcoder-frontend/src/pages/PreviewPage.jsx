import { useState, useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import ReactPlayer from "react-player";
import { getVideoDetails, getPreviewUrl, downloadVideo } from "../api/videoApi";

const QUALITIES = ["1080", "720", "480"];

function PreviewPage() {
  const { videoId } = useParams();
  const location = useLocation();
  const demoFile = location.state?.file; // present only in Demo Mode

  const [transcodedUrl, setTranscodedUrl] = useState(null);
  const [activeQuality, setActiveQuality] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  // Local, offline-playable URL built from your actual selected file.
  // Only created in Demo Mode (when demoFile exists).
  const demoUrl = useMemo(() => {
    return demoFile ? URL.createObjectURL(demoFile) : null;
  }, [demoFile]);

  const video = demoFile
    ? { originalName: demoFile.name, size: demoFile.size, cloudUrl: demoUrl }
    : null;

  // ---- DEMO MODE handlers (no backend needed) ----
  const handleShowDemo = (quality) => {
    setLoadingAction(`show-${quality}`);
    setTimeout(() => {
      setTranscodedUrl(demoUrl);
      setActiveQuality(quality);
      setLoadingAction(null);
    }, 800);
  };

  const handleDownloadDemo = (quality) => {
    setLoadingAction(`download-${quality}`);
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = demoUrl;
      a.download = `${quality}p-${demoFile.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setLoadingAction(null);
    }, 800);
  };

  // ---- REAL BACKEND handlers (used once Spring Boot is connected) ----
  const handleShowReal = async (quality) => {
    setLoadingAction(`show-${quality}`);
    try {
      const data = await getPreviewUrl(videoId, quality);
      setTranscodedUrl(data.url);
      setActiveQuality(quality);
    } catch (err) {
      console.error(err);
      alert("Could not load preview for this quality.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDownloadReal = async (quality) => {
    setLoadingAction(`download-${quality}`);
    try {
      const blob = await downloadVideo(videoId, quality);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quality}p.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Download failed for this quality.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Pick which handlers to use based on mode
  const handleShow = demoFile ? handleShowDemo : handleShowReal;
  const handleDownload = demoFile ? handleDownloadDemo : handleDownloadReal;

  if (!video) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-center px-4">
        <p>
          No demo file found. Go back to the Upload page, select a video,
          and click "Preview UI (Demo Mode)".
          <br />
          (Once the real backend exists, this page will instead fetch video{" "}
          {videoId} directly from the server.)
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white grid grid-cols-1 md:grid-cols-2">
      <div className="p-6 border-r border-slate-700">
        <h2 className="text-xl font-bold mb-4">Inputed Video</h2>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <ReactPlayer url={video.cloudUrl} controls width="100%" height="100%" />
        </div>
        <p className="mt-4">Video Title: {video.originalName}</p>
        <p>Video Size: {(video.size / (1024 * 1024)).toFixed(2)} MB</p>
        <p className="mt-2 text-xs text-yellow-400">
          (Demo mode — playing your local file directly, backend not connected yet)
        </p>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Transcoded Video</h2>

        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
          {transcodedUrl ? (
            <ReactPlayer url={transcodedUrl} controls width="100%" height="100%" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Select a quality to preview
            </div>
          )}
        </div>

        <div className="space-y-4">
          {QUALITIES.map((quality) => (
            <div
              key={quality}
              className="flex items-center justify-between bg-slate-800 p-4 rounded-lg"
            >
              <span>Video with quality {quality}p</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleShow(quality)}
                  disabled={loadingAction === `show-${quality}`}
                  className={`px-4 py-1 rounded ${
                    activeQuality === quality ? "bg-green-600" : "bg-green-700"
                  } hover:bg-green-600 disabled:opacity-40`}
                >
                  {loadingAction === `show-${quality}` ? "..." : "Show"}
                </button>
                <button
                  onClick={() => handleDownload(quality)}
                  disabled={loadingAction === `download-${quality}`}
                  className="px-4 py-1 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-40"
                >
                  {loadingAction === `download-${quality}`
                    ? "..."
                    : `Download ${quality}p`}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PreviewPage;