import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import {
  AudioLines, Check, ChevronDown, CircleHelp, Download, FileAudio, FileVideo,
  Film, HardDrive, LoaderCircle, Music2, ShieldCheck, Upload, Video, X
} from 'lucide-react';
import './style.css';

const MAX_SIZE = 500 * 1024 * 1024;
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
const VIDEO_EXTENSIONS = /\.(mp4|mov|mkv|webm|avi|m4v|mpeg|mpg|3gp)$/i;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeBaseName(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[^\w\- ()]+/g, '_').trim().slice(0, 100) || 'converted';
}

function getFileExtension(name) {
  const match = (name || '').match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'mp4';
}

function isVideoFile(candidate) {
  if (!candidate || typeof candidate.name !== 'string') return false;
  const mimeValid = typeof candidate.type === 'string' && candidate.type.startsWith('video/');
  return mimeValid || VIDEO_EXTENSIONS.test(candidate.name);
}

function App() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const ffmpegRef = useRef(null);
  const inputRef = useRef(null);
  const resultUrlRef = useRef(null);
  const busy = status === 'loading' || status === 'converting';

  useEffect(() => () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const resetResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  };

  const chooseFile = (candidate) => {
    if (!candidate) return;
    if (!isVideoFile(candidate)) {
      setMessage('Please choose a video file such as MP4, MOV, MKV, WebM, or AVI.');
      return;
    }
    if (candidate.size > MAX_SIZE) {
      setMessage('This demo is limited to 500 MB per file. Larger files may exhaust browser memory.');
      return;
    }
    resetResult();
    setMessage('');
    setProgress(0);
    setFile(candidate);
    setStatus('idle');
  };

  const loadEngine = async () => {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current;
    const ffmpeg = ffmpegRef.current || new FFmpeg();
    ffmpegRef.current = ffmpeg;
    ffmpeg.on('progress', ({ progress: p }) => {
      if (Number.isFinite(p)) setProgress(Math.max(0, Math.min(100, Math.round(p * 100))));
    });
    setStatus('loading');
    setMessage('Loading the conversion engine… This may take a moment on the first use.');
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm')
    });
    return ffmpeg;
  };

  const convert = async () => {
    if (!file || busy) return;
    resetResult();
    setProgress(0);
    try {
      const ffmpeg = await loadEngine();
      setStatus('converting');
      setMessage(format === 'mp3' ? 'Extracting audio and encoding MP3…' : 'Converting video to MP4…');
      const inputExtension = getFileExtension(file.name);
      const inputName = `input_${Date.now()}.${inputExtension.replace(/[^a-z0-9]/g, '') || 'mp4'}`;
      const outputName = `output_${Date.now()}.${format}`;
      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

      const args = format === 'mp3'
        ? ['-i', inputName, '-vn', '-codec:a', 'libmp3lame', '-q:a', '2', outputName]
        : ['-i', inputName, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputName];

      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile(outputName);
      const outputBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      const mime = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
      const blob = new Blob([outputBytes], { type: mime });
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResult({ url, name: `${safeBaseName(file.name)}.${format}`, size: outputBytes.length, mime });
      setStatus('done');
      setProgress(100);
      setMessage('Your file is ready to download.');
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(`Conversion failed. Try a smaller or different video file. ${err?.message ? `Details: ${err.message}` : ''}`);
    }
  };

  const clearFile = () => {
    if (busy) return;
    setFile(null);
    setStatus('idle');
    setMessage('');
    setProgress(0);
    resetResult();
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="KhmerMP3 home">
          <span className="brand-badge">
            <img className="brand-mini-logo" src="/small-logo.png" alt="KhmerMP3 logo" />
          </span>
          <span className="brand-name">KhmerMP3</span>
        </a>
        <div className="topbar-right"><span className="privacy"><ShieldCheck size={15}/> Private by design</span><a className="help-link" href="#how-it-works"><CircleHelp size={16}/> How it works</a></div>
      </header>

      <main>
        <section className="hero">
        </section>

        <section className="converter-card" aria-label="Video converter">
          <div className="card-head">
            <div><div className="section-kicker">VIDEO CONVERTER</div><h2>Convert a file</h2></div>
            <span className="local-badge"><ShieldCheck size={14}/> Runs in your browser</span>
          </div>

          <div
            className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !busy && inputRef.current?.click()}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click(); }}
          >
            <input ref={inputRef} type="file" accept="video/*,.mkv,.avi,.mov,.webm,.m4v" hidden onChange={(e) => chooseFile(e.target.files?.[0])}/>
            {file ? (
              <div className="selected-file">
                <div className="file-icon"><FileVideo size={25}/></div>
                <div className="file-meta"><strong>{file.name}</strong><span>{formatBytes(file.size)} · Video file</span></div>
                {!busy && <button type="button" className="icon-button" aria-label="Remove file" onClick={(e) => { e.stopPropagation(); clearFile(); }}><X size={18}/></button>}
              </div>
            ) : (
              <>
                <div className="upload-icon"><Upload size={25}/></div>
                <h3>Drop your video here</h3>
                <p>or <span className="browse-link">browse files</span> on your device</p>
                <div className="file-types"><span>MP4</span><span>MOV</span><span>MKV</span><span>WEBM</span><span>AVI</span></div>
              </>
            )}
          </div>

          <div className="format-label">CHOOSE OUTPUT FORMAT</div>
          <div className="format-options">
            <button type="button" className={`format-option ${format === 'mp3' ? 'active' : ''}`} onClick={() => { setFormat('mp3'); resetResult(); if (!busy) setStatus('idle'); }} disabled={busy}>
              <span className="format-icon audio"><Music2 size={21}/></span><span className="format-text"><strong>MP3 Audio</strong><small>Extract sound only</small></span><span className="radio-dot">{format === 'mp3' && <span/>}</span>
            </button>
            <button type="button" className={`format-option ${format === 'mp4' ? 'active' : ''}`} onClick={() => { setFormat('mp4'); resetResult(); if (!busy) setStatus('idle'); }} disabled={busy}>
              <span className="format-icon video"><Film size={21}/></span><span className="format-text"><strong>MP4 Video</strong><small>Convert video format</small></span><span className="radio-dot">{format === 'mp4' && <span/>}</span>
            </button>
          </div>

          {busy && <div className="progress-wrap"><div className="progress-caption"><span>{status === 'loading' ? 'Preparing engine' : 'Converting your file'}</span><strong>{status === 'loading' ? '…' : `${progress}%`}</strong></div><div className="progress-track"><div className="progress-fill" style={{width: `${status === 'loading' ? 12 : progress}%`}}/></div></div>}

          {message && <div className={`status-message ${status === 'error' ? 'error' : status === 'done' ? 'success' : ''}`}>{status === 'done' && <Check size={17}/>}<span>{message}</span></div>}

          {result ? (
            <div className="result-panel">
              <div className="result-icon"><Check size={21}/></div>
              <div className="result-details"><strong>{result.name}</strong><span>{formatBytes(result.size)} · Ready to download</span></div>
              <a className="download-button" href={result.url} download={result.name}><Download size={17}/> Download</a>
            </div>
          ) : (
            <button type="button" className="convert-button" onClick={convert} disabled={!file || busy}>
              {busy ? <><LoaderCircle size={19} className="spin"/> {status === 'loading' ? 'Loading converter…' : 'Converting…'}</> : <><span>Convert to {format.toUpperCase()}</span><ChevronDown size={17} className="button-arrow"/></>}
            </button>
          )}
          <p className="privacy-note"><ShieldCheck size={15}/> Your file stays on your device. It is processed locally in your browser.</p>
        </section>

        <section className="features" id="how-it-works">
          <div className="feature"><span className="feature-icon"><HardDrive size={20}/></span><div><strong>No uploads to a server</strong><p>Conversion happens locally in your browser.</p></div></div>
          <div className="feature"><span className="feature-icon"><Video size={20}/></span><div><strong>Two useful formats</strong><p>Extract MP3 audio or create an MP4 video.</p></div></div>
          <div className="feature"><span className="feature-icon"><ShieldCheck size={20}/></span><div><strong>No account required</strong><p>Open the site and start converting.</p></div></div>
        </section>
        <div className="notice"><strong>Good to know</strong><p>The first conversion downloads the FFmpeg engine and may take a little while. Conversion uses your device's memory and processor; large files can be slow or fail on phones. This demo accepts files up to 500 MB. Only convert media you have permission to use.</p></div>
      </main>
      <footer><a className="brand footer-brand" href="#"><span className="brand-icon"><AudioLines size={17}/></span><span>KhmerMP3</span></a><span>Made for your media. © {new Date().getFullYear()}</span></footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
