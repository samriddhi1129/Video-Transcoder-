
import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080";

function App() {
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cropWidth, setCropWidth] = useState(640);
const [cropHeight, setCropHeight] = useState(360);
const [cropX, setCropX] = useState(0);
const [cropY, setCropY] = useState(0);
const [isCropping, setIsCropping] = useState(false);
const [rotation, setRotation] = useState(0);
const [flipHorizontal, setFlipHorizontal] = useState(false);
const [flipVertical, setFlipVertical] = useState(false);
const [isRotating, setIsRotating] = useState(false);
const [speed, setSpeed] = useState(1);
const [isChangingSpeed, setIsChangingSpeed] = useState(false);
const [mergeFiles, setMergeFiles] = useState([]);
const [isMerging, setIsMerging] = useState(false);
const [splitStart, setSplitStart] = useState(0);
const [splitEnd, setSplitEnd] = useState(5);
const [isSplitting, setIsSplitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/hello`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend connection failed.");
        }
        return response.text();
      })
      .then((text) => setMessage(text))
      .catch(() => setMessage("Backend connection not available."));
  }, []);

  function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }

    if (video?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(video.url);
    }

    setVideo({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      isProcessed: false,
    });

    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setError("");
    setMessage("");
  }

  function handleVideoLoaded() {
    const videoDuration = videoRef.current?.duration;

    if (Number.isFinite(videoDuration)) {
      setDuration(videoDuration);
      setTrimEnd(videoDuration);
    }
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  async function handleTrim() {
    if (!video) {
      setError("Please upload a video first.");
      return;
    }

    if (
      trimStart < 0 ||
      trimEnd <= trimStart ||
      (duration > 0 && trimEnd > duration)
    ) {
      setError("Please enter a valid start and end time.");
      return;
    }

    setIsTrimming(true);
    setError("");
    setMessage("Processing your video...");

    try {
      const formData = new FormData();

      formData.append("video", video.file);
      formData.append("startTime", String(trimStart));
      formData.append("endTime", String(trimEnd));

      const response = await fetch(`${API_URL}/api/editor/trim`, {
        method: "POST",
        body: formData,
      });

      const result = await response.text();

      if (!response.ok) {
        throw new Error(result || "Video trimming failed.");
      }

      const successPrefix = "Video trimmed successfully:";

      if (!result.startsWith(successPrefix)) {
        throw new Error(result || "Unexpected response from backend.");
      }

      const outputPath = result.slice(successPrefix.length).trim();
      const filename = outputPath.split(/[\\/]/).pop();

      if (!filename || !filename.endsWith(".mp4")) {
        throw new Error("Could not identify the processed video.");
      }

      const previewUrl = `${API_URL}/api/editor/preview/${encodeURIComponent(
        filename
      )}`;

      setVideo((previous) => ({
        ...previous,
        url: previewUrl,
        name: `trimmed-${previous.name}`,
        isProcessed: true,
      }));

      setMessage("Video trimmed successfully!");
    } catch (err) {
      console.error("Trim error:", err);
      setError(
        err.message ||
          "Unable to trim the video. Check that Spring Boot is running."
      );
      setMessage("");
    } finally {
      setIsTrimming(false);
    }
  }
  async function handleCrop() {
  if (!video) {
    setError("Please upload a video first.");
    return;
  }

  if (
    cropWidth <= 0 ||
    cropHeight <= 0 ||
    cropX < 0 ||
    cropY < 0 ||
    cropWidth % 2 !== 0 ||
    cropHeight % 2 !== 0
  ) {
    setError("Width and height must be positive even numbers. X and Y cannot be negative.");
    return;
  }

  setIsCropping(true);
  setError("");
  setMessage("Cropping your video...");

  try {
    const formData = new FormData();

    formData.append("video", video.file);
    formData.append("width", String(cropWidth));
    formData.append("height", String(cropHeight));
    formData.append("x", String(cropX));
    formData.append("y", String(cropY));

    const response = await fetch(`${API_URL}/api/editor/crop`, {
      method: "POST",
      body: formData,
    });

    const result = await response.text();

    if (!response.ok) {
      throw new Error(result || "Video cropping failed.");
    }

    const successPrefix = "Video cropped successfully:";

    if (!result.startsWith(successPrefix)) {
      throw new Error(result || "Unexpected response from backend.");
    }

    const outputPath = result.slice(successPrefix.length).trim();
    const filename = outputPath.split(/[\\/]/).pop();

    if (!filename || !filename.endsWith(".mp4")) {
      throw new Error("Could not identify the cropped video.");
    }

    const previewUrl =
      `${API_URL}/api/editor/preview/${encodeURIComponent(filename)}`;

    setVideo((previous) => ({
      ...previous,
      url: previewUrl,
      name: `cropped-${previous.name}`,
      isProcessed: true,
    }));

    setMessage("Video cropped successfully!");
  } catch (err) {
    console.error("Crop error:", err);
    setError(err.message || "Unable to crop the video.");
    setMessage("");
  } finally {
    setIsCropping(false);
  }
}
async function handleRotate() {
  if (!video) {
    setError("Please upload a video first.");
    return;
  }

  setIsRotating(true);
  setError("");
  setMessage("Processing video rotation and flip...");

  try {
    const formData = new FormData();

    formData.append("video", video.file);
    formData.append("rotation", String(rotation));
    formData.append("flipHorizontal", String(flipHorizontal));
    formData.append("flipVertical", String(flipVertical));

    const response = await fetch(`${API_URL}/api/editor/rotate`, {
      method: "POST",
      body: formData,
    });

    const result = await response.text();

    if (!response.ok) {
      throw new Error(result || "Video rotation failed.");
    }

    const successPrefix = "Video rotated successfully:";

    if (!result.startsWith(successPrefix)) {
      throw new Error(result || "Unexpected response from backend.");
    }

    const outputPath = result.slice(successPrefix.length).trim();
    const filename = outputPath.split(/[\\/]/).pop();

    if (!filename || !filename.endsWith(".mp4")) {
      throw new Error("Could not identify the processed video.");
    }

    const previewUrl =
      `${API_URL}/api/editor/preview/${encodeURIComponent(filename)}`;

    setVideo((previous) => ({
      ...previous,
      url: previewUrl,
      name: `rotated-${previous.name}`,
      isProcessed: true,
    }));

    setMessage("Video rotated/flipped successfully!");
  } catch (err) {
    console.error("Rotate error:", err);
    setError(err.message || "Unable to rotate the video.");
    setMessage("");
  } finally {
    setIsRotating(false);
  }
}
async function handleSpeedChange() {
  if (!video?.file) {
    setError("Please upload a video first.");
    return;
  }

  setIsChangingSpeed(true);
  setError("");
  setMessage("Changing video speed...");

  try {
    const formData = new FormData();
    formData.append("video", video.file);
    formData.append("speed", String(speed));

    const response = await fetch(
      `${API_URL}/api/editor/speed`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.text();

    if (!response.ok) {
      throw new Error(result || "Speed change failed.");
    }

    const successPrefix = "Video speed changed successfully:";

    if (!result.startsWith(successPrefix)) {
      throw new Error(result || "Unexpected backend response.");
    }

    const filename = result.slice(successPrefix.length).trim();

    if (!/^speed-[a-f0-9-]+\.mp4$/i.test(filename)) {
      throw new Error("Invalid processed video filename.");
    }

    setVideo((previous) => ({
      ...previous,
      url: `${API_URL}/api/editor/preview/${encodeURIComponent(filename)}`,
      name: `speed-${previous.name}`,
      isProcessed: true,
    }));

    setMessage("Video speed changed successfully!");
  } catch (err) {
    console.error("Speed change error:", err);
    setError(err.message || "Could not change video speed.");
    setMessage("");
  } finally {
    setIsChangingSpeed(false);
  }
}
async function handleMerge() {
  if (mergeFiles.length < 2) {
    setError("Please select at least two videos to merge.");
    return;
  }

  setIsMerging(true);
  setError("");
  setMessage("Merging videos...");

  try {
    const formData = new FormData();

    mergeFiles.forEach((file) => {
      formData.append("videos", file);
    });

    const response = await fetch(`${API_URL}/api/editor/merge`, {
      method: "POST",
      body: formData,
    });

    const result = await response.text();

    if (!response.ok) {
      throw new Error(result || "Video merging failed.");
    }

    const successPrefix = "Videos merged successfully:";

    if (!result.startsWith(successPrefix)) {
      throw new Error(result || "Unexpected backend response.");
    }

    const filename = result.slice(successPrefix.length).trim();

    if (!/^merged-[a-f0-9-]+\.mp4$/i.test(filename)) {
      throw new Error("Invalid merged video filename.");
    }

    setVideo({
      file: null,
      url: `${API_URL}/api/editor/preview/${encodeURIComponent(filename)}`,
      name: filename,
      isProcessed: true,
    });

    setMergeFiles([]);
    setMessage("Videos merged successfully!");
  } catch (err) {
    console.error("Merge error:", err);
    setError(err.message || "Unable to merge videos.");
    setMessage("");
  } finally {
    setIsMerging(false);
  }
}
const handleSplit = async () => {
    if (!video || !video.file) {
        setError("Please upload a video before splitting.");
        return;
    }

    if (
        splitStart < 0 ||
        splitEnd <= splitStart ||
        splitEnd > duration
    ) {
        setError("Please enter valid start and end times.");
        return;
    }

    setIsSplitting(true);
    setError("");
    setMessage("");

    try {
        const formData = new FormData();
        formData.append("video", video.file);
        formData.append("startTime", String(splitStart));
        formData.append("endTime", String(splitEnd));

        const response = await fetch(
            `${API_URL}/api/editor/split`,
            {
                method: "POST",
                body: formData,
            }
        );

        const result = await response.text();

        if (!response.ok) {
            throw new Error(result || "Video split failed.");
        }

        const prefix = "Video split successfully:";
        if (!result.startsWith(prefix)) {
            throw new Error(result || "Video split failed.");
        }
const outputPath = result.substring(prefix.length).trim();
const filename = outputPath.split(/[\\/]/).pop();

if (!/^split-[a-f0-9-]+\.mp4$/i.test(filename)) {
    throw new Error("Invalid split video filename.");
}

setVideo((previous) => ({
    ...previous,
    name: filename,
    url: `${API_URL}/api/editor/preview/${encodeURIComponent(filename)}`,
    file: null,
    isProcessed: true,
}));

        setMessage("Video split successfully!");
    } catch (err) {
        setError(err.message || "Unable to split video.");
    } finally {
        setIsSplitting(false);
    }
};
  function handleDownload() {
    if (!video?.isProcessed) return;

    const link = document.createElement("a");
    link.href = video.url;
    link.download = video.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function handleRemoveVideo() {
    if (video?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(video.url);
    }

    setVideo(null);
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setMessage("");
    setError("");
  }

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">VIDEO STUDIO</p>
          <h1>Video Editor</h1>
          <p className="subtitle">
            Upload, preview, trim and download your video.
          </p>
        </div>

        <span className="backend-status">
          <span className="status-dot" />
          Spring Boot
        </span>
      </header>

      <section className="workspace">
        <div className="panel upload-panel">
          <h2>1. Upload video</h2>
          <p className="muted">
            Choose a video from your computer to get started.
          </p>

          <label className="upload-area">
            <span className="upload-icon">↑</span>
            <span className="upload-title">Choose a video</span>
            <span className="muted">MP4, WebM and other browser-supported formats</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleUpload}
            />
          </label>

          {video && (
            <div className="file-details">
              <div>
                <strong>{video.name}</strong>
                <p className="muted">
                  {duration > 0
                    ? `Duration: ${formatTime(duration)}`
                    : "Loading video details..."}
                </p>
              </div>

              <button
                className="button button-secondary"
                onClick={handleRemoveVideo}
                type="button"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="panel preview-panel">
          <h2>2. Video preview</h2>

          {video ? (
            <video
              key={video.url}
              ref={videoRef}
              className="video-player"
              src={video.url}
              controls
              onLoadedMetadata={handleVideoLoaded}
            >
              Your browser does not support video playback.
            </video>
          ) : (
            <div className="empty-preview">
              <span className="preview-icon">▶</span>
              <p>Your video preview will appear here.</p>
            </div>
          )}

          {video && (
            <div className="preview-footer">
              <span className="muted">
                {video.isProcessed ? "Processed video" : "Original video"}
              </span>

              {video.isProcessed && (
                <button
                  className="button button-secondary"
                  onClick={handleDownload}
                  type="button"
                >
                  Download video
                </button>
              )}
            </div>
          )}
        </div>

        <div className="panel editor-panel">
          <h2>3. Trim video</h2>
          <p className="muted">
            Select the start and end points of the section you want to keep.
          </p>

          <div className="trim-controls">
            <label>
              <span>Start time (seconds)</span>
              <input
                type="number"
                min="0"
                max={duration || undefined}
                step="0.1"
                value={trimStart}
                onChange={(event) =>
                  setTrimStart(Number(event.target.value))
                }
                disabled={!video || isTrimming}
              />
            </label>

            <label>
              <span>End time (seconds)</span>
              <input
                type="number"
                min="0"
                max={duration || undefined}
                step="0.1"
                value={trimEnd}
                onChange={(event) =>
                  setTrimEnd(Number(event.target.value))
                }
                disabled={!video || isTrimming}
              />
            </label>
          </div>

          <div className="trim-summary">
            <span>Selected duration</span>
            <strong>
              {formatTime(Math.max(0, trimEnd - trimStart))}
            </strong>
          </div>

          <button
            className="button button-primary"
            onClick={handleTrim}
            disabled={
              !video ||
              isTrimming ||
              trimStart < 0 ||
              trimEnd <= trimStart ||
              (duration > 0 && trimEnd > duration)
            }
            type="button"
          >
            {isTrimming ? "Trimming video..." : "Trim video"}
          </button>
        </div>
        <div className="panel editor-panel">
  <h2>4. Crop video</h2>
  <p className="muted">
    Enter the crop area dimensions and its starting position in pixels.
  </p>

  <div className="trim-controls">
    <label>
      <span>Width (px)</span>
      <input
        type="number"
        min="2"
        step="2"
        value={cropWidth}
        onChange={(event) => setCropWidth(Number(event.target.value))}
        disabled={!video || isCropping}
      />
    </label>

    <label>
      <span>Height (px)</span>
      <input
        type="number"
        min="2"
        step="2"
        value={cropHeight}
        onChange={(event) => setCropHeight(Number(event.target.value))}
        disabled={!video || isCropping}
      />
    </label>

    <label>
      <span>X position (px)</span>
      <input
        type="number"
        min="0"
        value={cropX}
        onChange={(event) => setCropX(Number(event.target.value))}
        disabled={!video || isCropping}
      />
    </label>

    <label>
      <span>Y position (px)</span>
      <input
        type="number"
        min="0"
        value={cropY}
        onChange={(event) => setCropY(Number(event.target.value))}
        disabled={!video || isCropping}
      />
    </label>
  </div>

  <button
    className="button button-primary"
    onClick={handleCrop}
    disabled={
      !video ||
      isCropping ||
      cropWidth <= 0 ||
      cropHeight <= 0 ||
      cropWidth % 2 !== 0 ||
      cropHeight % 2 !== 0 ||
      cropX < 0 ||
      cropY < 0
    }
    type="button"
  >
    {isCropping ? "Cropping video..." : "Crop video"}
  </button>
</div>
<div className="panel editor-panel">
  <h2>5. Rotate & Flip video</h2>
  <p className="muted">
    Rotate your video or create a mirror effect.
  </p>

  <label>
    <span>Rotation angle</span>
    <select
      value={rotation}
      onChange={(event) => setRotation(Number(event.target.value))}
      disabled={!video || isRotating}
    >
      <option value={0}>No rotation</option>
      <option value={90}>90° clockwise</option>
      <option value={180}>180°</option>
      <option value={270}>270° clockwise</option>
    </select>
  </label>

  <div className="trim-controls">
    <label>
      <input
        type="checkbox"
        checked={flipHorizontal}
        onChange={(event) => setFlipHorizontal(event.target.checked)}
        disabled={!video || isRotating}
      />
      Flip horizontally
    </label>

    <label>
      <input
        type="checkbox"
        checked={flipVertical}
        onChange={(event) => setFlipVertical(event.target.checked)}
        disabled={!video || isRotating}
      />
      Flip vertically
    </label>
  </div>

  <button
    className="button button-primary"
    onClick={handleRotate}
    disabled={
      !video ||
      isRotating ||
      (rotation === 0 && !flipHorizontal && !flipVertical)
    }
    type="button"
  >
    {isRotating ? "Processing..." : "Apply rotation / flip"}
  </button>
</div>
<div className="panel editor-panel">
  <h2>6. Video Speed Control</h2>

  <label htmlFor="video-speed">
    Select playback speed
  </label>

  <select
    id="video-speed"
    value={speed}
    onChange={(e) => setSpeed(Number(e.target.value))}
    disabled={isChangingSpeed}
  >
    <option value={0.5}>0.5× - Slow Motion</option>
    <option value={1}>1× - Normal Speed</option>
    <option value={1.5}>1.5× - Fast</option>
    <option value={2}>2× - Double Speed</option>
  </select>

  <button
    onClick={handleSpeedChange}
    disabled={!video || isChangingSpeed}
  >
    {isChangingSpeed ? "Changing Speed..." : "Apply Video Speed"}
  </button>
</div>
<div className="panel editor-panel">
  <h2>7. Merge Videos</h2>

  <p className="muted">
    Select at least two videos to combine them into one video.
  </p>

  <label>
    <span>Choose videos</span>
  <input
  type="file"
  accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
  multiple
  onChange={(event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("video/") ||
        /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name)
    );

    setMergeFiles((previous) => [...previous, ...validFiles]);
    setError(
      validFiles.length !== files.length
        ? "Some files were not recognized as videos."
        : ""
    );
    setMessage("");

    event.target.value = "";
  }}
  disabled={isMerging}
/>
  </label>

  {mergeFiles.length > 0 && (
    <div className="file-details">
      <div>
        <strong>{mergeFiles.length} videos selected</strong>
        <ul>
          {mergeFiles.map((file, index) => (
            <li key={`${file.name}-${index}`}>{file.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )}

  <button
    className="button button-primary"
    onClick={handleMerge}
    disabled={mergeFiles.length < 2 || isMerging}
    type="button"
  >
    {isMerging ? "Merging videos..." : "Merge videos"}
  </button>
</div>
<div className="panel editor-panel">
  <h2>8. Split Video</h2>

  <p className="muted">
    Select the start and end time to split a section of your video.
  </p>

  <label>
    <span>Start Time (seconds)</span>
    <input
      type="number"
      min="0"
      max={duration}
      step="0.5"
      value={splitStart}
      onChange={(event) =>
        setSplitStart(Number(event.target.value))
      }
      disabled={isSplitting}
    />
  </label>

  <label>
    <span>End Time (seconds)</span>
    <input
      type="number"
      min="0"
      max={duration}
      step="0.5"
      value={splitEnd}
      onChange={(event) =>
        setSplitEnd(Number(event.target.value))
      }
      disabled={isSplitting}
    />
  </label>

  <button
    className="button button-primary"
    onClick={handleSplit}
    disabled={
      isSplitting ||
      !video ||
      splitStart < 0 ||
      splitEnd <= splitStart ||
      splitEnd > duration
    }
    type="button"
  >
    {isSplitting ? "Splitting video..." : "✂️ Split Video"}
  </button>
</div>
      </section>

      {(message || error) && (
        <div
          className={`notice ${error ? "notice-error" : "notice-success"}`}
          role="status"
        >
          {error || message}
        </div>
      )}

      <footer className="app-footer">
        <span>Video Studio</span>
        <span>{message.includes("Backend connection not available")
          ? "Backend disconnected"
          : "Video editing workspace"}</span>
      </footer>
    </main>
  );
}

export default App;
