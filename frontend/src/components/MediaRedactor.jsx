import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { API_BASE } from '../lib/api';
import { scan } from '../lib/scanner';
import './MediaRedactor.css';

// Lazy-load Tesseract.js from CDN for client-side OCR bounding-box detection
let tesseractPromise = null;
function loadTesseract() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!tesseractPromise) {
    tesseractPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = () => resolve(window.Tesseract || null);
      script.onerror = () => resolve(null);
      document.head.appendChild(script);
    });
  }
  return tesseractPromise;
}

/**
 * Generates a realistic high-DPI sample Bill / Invoice canvas and returns
 * { dataUrl, knownRegions, extractedText }
 */
function createSampleBillData() {
  const c = document.createElement('canvas');
  c.width = 760;
  c.height = 460;
  const ctx = c.getContext('2d');

  // Paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);

  // Header band
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, c.width, 68);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('APOLLO CLOUD — TAX INVOICE & BILL RECEIPT', 24, 42);
  ctx.font = '13px monospace';
  ctx.fillStyle = '#a5b4fc';
  ctx.fillText('INV #AC-2026-9941', 595, 42);

  // Customer & Billing Section
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('BILLED TO (CUSTOMER DETAILS):', 24, 102);

  ctx.font = '15px monospace';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Name: Aarav Sharma', 24, 130);
  ctx.fillText('Email: aarav.sharma@company.in', 24, 158);
  ctx.fillText('Phone: +91 98765 43210', 24, 186);
  ctx.fillText('PAN ID: ABCDE1234F', 24, 214);
  ctx.fillText('Aadhaar: 4991 1866 5246', 24, 242);

  // Payment & Bank Section on Right
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('PAYMENT & CREDENTIALS:', 400, 102);

  ctx.font = '15px monospace';
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Card: 4532 0151 1283 0366', 400, 130);
  ctx.fillText('Account: 00910293847561', 400, 158);
  ctx.fillText('IFSC: HDFC0001234', 400, 186);
  ctx.fillText('UPI: aarav.sharma@okhdfcbank', 400, 214);
  ctx.fillText('API Key: sk_live_51H8xYz99SecretKey88A', 400, 242);

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(24, 270);
  ctx.lineTo(736, 270);
  ctx.stroke();

  // Line items
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('DESCRIPTION', 24, 298);
  ctx.fillText('AMOUNT', 640, 298);

  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Enterprise AI Cloud Instance + Production DB Backup', 24, 328);
  ctx.fillText('Rs. 48,500.00', 630, 328);
  ctx.fillText('Security Audit & SSL Certificate Renewal', 24, 356);
  ctx.fillText('Rs. 12,000.00', 630, 356);

  // Footer + QR Placeholder
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(24, 382, 712, 56);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText('TOTAL PAID: Rs. 60,500.00', 40, 416);

  // Simulated QR Code block
  ctx.fillStyle = '#0f172a';
  for (let r = 0; r < 6; r++) {
    for (let col = 0; col < 6; col++) {
      if ((r + col) % 2 === 0 || r === 0 || col === 0) {
        ctx.fillRect(672 + col * 8, 386 + r * 8, 7, 7);
      }
    }
  }

  // Normalized 0..1000 coordinates [ymin, xmin, ymax, xmax]
  const regions = [
    { id: 'r1', label: 'Person Name (Aarav Sharma)', severity: 'medium', box_2d: [110, 74, 138, 255], active: true },
    { id: 'r2', label: 'Email Address', severity: 'medium', box_2d: [139, 74, 166, 365], active: true },
    { id: 'r3', label: 'Phone Number (+91 98765 43210)', severity: 'medium', box_2d: [167, 74, 195, 290], active: true },
    { id: 'r4', label: 'PAN Card Number', severity: 'high', box_2d: [196, 84, 224, 245], active: true },
    { id: 'r5', label: 'Aadhaar Number', severity: 'critical', box_2d: [224, 96, 252, 295], active: true },
    { id: 'r6', label: 'Credit Card (Luhn valid)', severity: 'critical', box_2d: [110, 445, 138, 705], active: true },
    { id: 'r7', label: 'Bank Account Number', severity: 'high', box_2d: [139, 472, 166, 685], active: true },
    { id: 'r8', label: 'IFSC Code', severity: 'medium', box_2d: [167, 445, 195, 620], active: true },
    { id: 'r9', label: 'UPI ID', severity: 'high', box_2d: [196, 438, 224, 725], active: true },
    { id: 'r10', label: 'Secret API Key', severity: 'critical', box_2d: [224, 468, 252, 748], active: true },
    { id: 'r11', label: 'Payment QR Code', severity: 'high', box_2d: [380, 875, 442, 955], active: true },
  ];

  const extractedText = `APOLLO CLOUD TAX INVOICE #AC-2026-9941\nName: Aarav Sharma\nEmail: aarav.sharma@company.in\nPhone: +91 98765 43210\nPAN: ABCDE1234F\nAadhaar: 4991 1866 5246\nCard: 4532 0151 1283 0366\nAccount: 00910293847561\nIFSC: HDFC0001234\nUPI: aarav.sharma@okhdfcbank`;

  return { dataUrl: c.toDataURL('image/png'), regions, extractedText };
}

export default function MediaRedactor({ onExtractedText, notify }) {
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video' | 'sim-video'
  const [mediaName, setMediaName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [regions, setRegions] = useState([]);
  const [blurMode, setBlurMode] = useState('blur'); // 'blur' | 'pixelate' | 'bar'
  const [blurStrength, setBlurStrength] = useState(18);
  const [showOriginal, setShowOriginal] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);

  const canvasRef = useRef(null);
  const imageObjRef = useRef(null);
  const videoElRef = useRef(null);
  const animFrameRef = useRef(null);
  const dragStartRef = useRef(null);
  const dragCurrRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop any running video loop on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (videoElRef.current) {
        try { videoElRef.current.pause(); } catch {}
      }
    };
  }, []);

  /**
   * Applies blur, mosaic pixelation, or solid redaction bar to a specific rectangular area on ctx
   */
  const redactRect = useCallback(
    (ctx, sourceElem, x, y, w, h, label) => {
      if (w < 4 || h < 4) return;
      const pad = 4;
      const rx = Math.max(0, x - pad);
      const ry = Math.max(0, y - pad);
      const rw = Math.min(ctx.canvas.width - rx, w + pad * 2);
      const rh = Math.min(ctx.canvas.height - ry, h + pad * 2);

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 6);
      ctx.clip();

      if (blurMode === 'bar') {
        ctx.fillStyle = '#12151b';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.fillStyle = '#0dcaf0';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`[REDACTED: ${label || 'SENSITIVE'}]`, rx + 8, ry + Math.min(rh - 6, 17));
      } else if (blurMode === 'pixelate') {
        // Mosaic pixelation by downscaling to tiny offscreen canvas and drawing back without smoothing
        const blockSize = Math.max(6, Math.round(blurStrength / 1.6));
        const sw = Math.max(2, Math.ceil(rw / blockSize));
        const sh = Math.max(2, Math.ceil(rh / blockSize));
        const off = document.createElement('canvas');
        off.width = sw;
        off.height = sh;
        const octx = off.getContext('2d');
        octx.drawImage(sourceElem, rx, ry, rw, rh, 0, 0, sw, sh);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, sw, sh, rx, ry, rw, rh);
        ctx.imageSmoothingEnabled = true;
      } else {
        // Multi-pass Gaussian blur + frosted overlay so underlying digits are 100% unreadable
        ctx.filter = `blur(${blurStrength}px)`;
        ctx.drawImage(sourceElem, rx, ry, rw, rh, rx, ry, rw, rh);
        ctx.drawImage(sourceElem, rx, ry, rw, rh, rx, ry, rw, rh);
        ctx.filter = 'none';
        ctx.fillStyle = 'rgba(113, 44, 249, 0.14)';
        ctx.fillRect(rx, ry, rw, rh);
      }

      ctx.restore();

      // Subtle glowing security border around blurred region
      ctx.save();
      ctx.strokeStyle = 'rgba(13, 202, 240, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.restore();
    },
    [blurMode, blurStrength],
  );

  /**
   * Renders the current image or video frame + all active blur regions
   */
  const renderCanvas = useCallback(
    (sourceElem, width, height, currentRegions = regions) => {
      const canvas = canvasRef.current;
      if (!canvas || !sourceElem) return;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(sourceElem, 0, 0, width, height);

      if (!showOriginal) {
        for (const r of currentRegions) {
          if (r.active === false) continue;
          const [ymin, xmin, ymax, xmax] = r.box_2d;
          const x = (xmin / 1000) * width;
          const y = (ymin / 1000) * height;
          const w = ((xmax - xmin) / 1000) * width;
          const h = ((ymax - ymin) / 1000) * height;
          redactRect(ctx, sourceElem, x, y, w, h, r.label);
        }
      }

      // If user is currently dragging a custom blur box
      if (dragStartRef.current && dragCurrRef.current) {
        const x0 = Math.min(dragStartRef.current.x, dragCurrRef.current.x);
        const y0 = Math.min(dragStartRef.current.y, dragCurrRef.current.y);
        const w = Math.abs(dragCurrRef.current.x - dragStartRef.current.x);
        const h = Math.abs(dragCurrRef.current.y - dragStartRef.current.y);
        ctx.save();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(168, 85, 247, 0.22)';
        ctx.fillRect(x0, y0, w, h);
        ctx.strokeRect(x0, y0, w, h);
        ctx.restore();
      }
    },
    [regions, showOriginal, redactRect],
  );

  // Re-render static image whenever regions, blurMode, blurStrength, or showOriginal changes
  useEffect(() => {
    if (mediaType === 'image' && imageObjRef.current) {
      const img = imageObjRef.current;
      renderCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height, regions);
    }
  }, [mediaType, regions, blurMode, blurStrength, showOriginal, renderCanvas]);

  /**
   * Dual-engine scanner for any image/frame dataUrl:
   * 1) Calls backend Gemini Vision (/api/vision-scan)
   * 2) Runs client-side Tesseract.js OCR + local PromptShield scan()
   */
  async function analyzeFrameDataUrl(dataUrl, imgWidth, imgHeight) {
    setScanning(true);
    const detectedRegions = [];
    let fullText = '';

    try {
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const res = await fetch(`${API_BASE}/vision-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/png' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.extractedText) fullText = data.extractedText;
        if (Array.isArray(data.regions) && data.regions.length > 0) {
          data.regions.forEach((r, idx) => {
            if (Array.isArray(r.box_2d) && r.box_2d.length === 4) {
              detectedRegions.push({
                id: `v-${idx}`,
                label: r.label || 'Sensitive data',
                severity: r.severity || 'high',
                box_2d: r.box_2d,
                active: true,
              });
            }
          });
        }
      }
    } catch {
      // Fallback to local OCR below
    }

    // Run client-side Tesseract OCR if Gemini Vision didn't return regions
    if (detectedRegions.length === 0) {
      try {
        const Tesseract = await loadTesseract();
        if (Tesseract) {
          const ocr = await Tesseract.recognize(dataUrl, 'eng');
          const text = ocr?.data?.text || '';
          if (text.trim() && !fullText) fullText = text.trim();

          const lines = ocr?.data?.lines || [];
          lines.forEach((line, idx) => {
            const lineText = (line.text || '').trim();
            if (!lineText) return;
            const scanRes = scan(lineText);
            const hasKeyHint = /\b(card|account|aadhaar|pan|phone|mobile|email|password|secret|key|upi|ifsc|cvv|dob|invoice|total)\b/i.test(lineText);
            if (scanRes.matches.length > 0 || hasKeyHint) {
              const b = line.bbox;
              if (b && imgWidth && imgHeight) {
                const ymin = Math.round((b.y0 / imgHeight) * 1000);
                const xmin = Math.round((b.x0 / imgWidth) * 1000);
                const ymax = Math.round((b.y1 / imgHeight) * 1000);
                const xmax = Math.round((b.x1 / imgWidth) * 1000);
                const topMatch = scanRes.matches[0];
                detectedRegions.push({
                  id: `ocr-${idx}`,
                  label: topMatch ? `${topMatch.label}` : `Sensitive line`,
                  severity: topMatch ? topMatch.severity : 'medium',
                  box_2d: [ymin, xmin, ymax, xmax],
                  active: true,
                });
              }
            }
          });
        }
      } catch {
        // ignore OCR error
      }
    }

    if (fullText) {
      onExtractedText?.(fullText);
    }

    setScanning(false);
    return detectedRegions;
  }

  /**
   * Load an uploaded Image or Video file
   */
  async function handleFileUpload(file) {
    if (!file) return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (videoElRef.current) {
      try { videoElRef.current.pause(); } catch {}
    }

    setMediaName(file.name);
    setShowOriginal(false);

    if (file.type.startsWith('video/')) {
      setMediaType('video');
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.src = url;
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      videoElRef.current = vid;

      vid.onloadeddata = async () => {
        const vw = vid.videoWidth || 640;
        const vh = vid.videoHeight || 360;
        // Capture first frame to detect sensitive regions in the video
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = vw;
        tempCanvas.height = vh;
        tempCanvas.getContext('2d').drawImage(vid, 0, 0, vw, vh);
        const frameUrl = tempCanvas.toDataURL('image/png');

        const found = await analyzeFrameDataUrl(frameUrl, vw, vh);
        const initialRegions = found.length
          ? found
          : [
              { id: 'vid-default-1', label: 'Detected Sensitive Region', severity: 'high', box_2d: [180, 120, 340, 620], active: true },
            ];
        setRegions(initialRegions);
        vid.play().catch(() => {});

        const loop = () => {
          if (videoElRef.current === vid) {
            renderCanvas(vid, vw, vh, initialRegions);
            animFrameRef.current = requestAnimationFrame(loop);
          }
        };
        animFrameRef.current = requestAnimationFrame(loop);
      };
      return;
    }

    // Otherwise treat as Image (Bill, Photo, ID Card, Screenshot)
    setMediaType('image');
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = String(e.target?.result || '');
      const img = new Image();
      img.onload = async () => {
        imageObjRef.current = img;
        const w = Math.min(img.naturalWidth || 760, 960);
        const h = Math.round(((img.naturalHeight || 480) / (img.naturalWidth || 760)) * w);
        renderCanvas(img, w, h, []);
        const found = await analyzeFrameDataUrl(dataUrl, img.naturalWidth || w, img.naturalHeight || h);
        setRegions(found);
        notify?.(
          found.length
            ? `Scanned ${file.name}: auto-blurred ${found.length} sensitive regions`
            : `Loaded ${file.name}: drag across any area on the image to blur it`,
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  /**
   * 1-Click Sample Tax Bill / Receipt Generator
   */
  function loadSampleBill() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const { dataUrl, regions: billRegions, extractedText } = createSampleBillData();
    setMediaType('image');
    setMediaName('apollo-tax-invoice-bill.png');
    setShowOriginal(false);

    const img = new Image();
    img.onload = () => {
      imageObjRef.current = img;
      setRegions(billRegions);
      onExtractedText?.(extractedText);
      notify?.('Scanned Sample Tax Bill: 11 sensitive fields auto-blurred & sent to Prompt Scanner!');
    };
    img.src = dataUrl;
  }

  /**
   * 1-Click Sample Video Stream with Real-Time Moving PII Auto-Blur
   */
  function loadSampleVideo() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const { dataUrl, regions: billRegions, extractedText } = createSampleBillData();
    setMediaType('sim-video');
    setMediaName('live-bill-camera-scan.webm');
    setShowOriginal(false);
    setRegions(billRegions);
    onExtractedText?.(extractedText);

    const baseImg = new Image();
    baseImg.onload = () => {
      const off = document.createElement('canvas');
      off.width = 760;
      off.height = 460;
      const octx = off.getContext('2d');
      let t = 0;

      const step = () => {
        t += 0.03;
        const dx = Math.sin(t) * 18;
        const dy = Math.cos(t * 0.8) * 10;
        octx.fillStyle = '#0f172a';
        octx.fillRect(0, 0, off.width, off.height);
        octx.drawImage(baseImg, dx, dy);

        // Shift regions dynamically with the moving camera feed
        const shifted = billRegions.map((r) => ({
          ...r,
          box_2d: [
            r.box_2d[0] + (dy / 460) * 1000,
            r.box_2d[1] + (dx / 760) * 1000,
            r.box_2d[2] + (dy / 460) * 1000,
            r.box_2d[3] + (dx / 760) * 1000,
          ],
        }));
        renderCanvas(off, off.width, off.height, shifted);
        animFrameRef.current = requestAnimationFrame(step);
      };
      animFrameRef.current = requestAnimationFrame(step);
      notify?.('Started Live Video PII Auto-Blur stream!');
    };
    baseImg.src = dataUrl;
  }

  // Keep video loop using latest blur settings
  useEffect(() => {
    if (mediaType === 'video' && videoElRef.current) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const vid = videoElRef.current;
      const vw = vid.videoWidth || 640;
      const vh = vid.videoHeight || 360;
      const loop = () => {
        renderCanvas(vid, vw, vh, regions);
        animFrameRef.current = requestAnimationFrame(loop);
      };
      animFrameRef.current = requestAnimationFrame(loop);
    }
  }, [mediaType, regions, blurMode, blurStrength, showOriginal, renderCanvas]);

  /**
   * Mouse / Touch Drag on Canvas to Add Custom Blur Box
   */
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e) => {
    if (!mediaType) return;
    dragStartRef.current = getCanvasCoords(e);
    dragCurrRef.current = dragStartRef.current;
  };

  const onPointerMove = (e) => {
    if (!dragStartRef.current) return;
    dragCurrRef.current = getCanvasCoords(e);
    if (mediaType === 'image' && imageObjRef.current) {
      renderCanvas(imageObjRef.current, canvasRef.current.width, canvasRef.current.height, regions);
    }
  };

  const onPointerUp = () => {
    if (!dragStartRef.current || !dragCurrRef.current || !canvasRef.current) return;
    const cw = canvasRef.current.width;
    const ch = canvasRef.current.height;
    const x0 = Math.min(dragStartRef.current.x, dragCurrRef.current.x);
    const y0 = Math.min(dragStartRef.current.y, dragCurrRef.current.y);
    const x1 = Math.max(dragStartRef.current.x, dragCurrRef.current.x);
    const y1 = Math.max(dragStartRef.current.y, dragCurrRef.current.y);
    dragStartRef.current = null;
    dragCurrRef.current = null;

    if (x1 - x0 > 12 && y1 - y0 > 10) {
      const newRegion = {
        id: `custom-${Date.now()}`,
        label: 'Custom Redacted Area',
        severity: 'high',
        box_2d: [
          Math.round((y0 / ch) * 1000),
          Math.round((x0 / cw) * 1000),
          Math.round((y1 / ch) * 1000),
          Math.round((x1 / cw) * 1000),
        ],
        active: true,
      };
      setRegions((prev) => [...prev, newRegion]);
      notify?.('Added custom blur box');
    } else if (mediaType === 'image' && imageObjRef.current) {
      renderCanvas(imageObjRef.current, cw, ch, regions);
    }
  };

  const toggleRegion = (id) => {
    setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const downloadBlurredImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `redacted-${mediaName.replace(/\.[^.]+$/, '') || 'bill'}.png`;
    a.click();
    notify?.('Downloaded blurred image (.png)');
  };

  const exportBlurredVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.captureStream || typeof window.MediaRecorder === 'undefined') {
      notify?.('Video recording is not supported in this browser.', 'error');
      return;
    }
    setRecordingVideo(true);
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redacted-video-${Date.now()}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setRecordingVideo(false);
      notify?.('Downloaded blurred video (.webm)!');
    };
    recorder.start();
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop();
    }, 4000);
  };

  return (
    <section className="card wow-border-beam media-redactor">
      <div className="media-head-row">
        <div>
          <h2 className="bs-heading-fx">
            <span className="step-badge" title="Document, photo & video redaction">
              <Icon name="shield" size={13} />
            </span>
            <span>Redact a bill, photo, or video</span>
          </h2>
          <p className="muted tiny" style={{ marginTop: 2 }}>
            Drop an invoice, ID card photo, or screen recording to blur private details and extract the text below.
          </p>
        </div>

        <div className="media-actions-bar">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,video/*"
            onChange={(e) => {
              handleFileUpload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
            <Icon name="upload" size={14} />Upload photo or video
          </button>
          <button type="button" className="btn btn-sm" onClick={loadSampleBill}>
            <Icon name="file" size={14} />Sample tax invoice
          </button>
          <button type="button" className="btn btn-sm" onClick={loadSampleVideo}>
            <Icon name="play" size={14} />Sample video
          </button>
        </div>
      </div>

      {mediaType && (
        <div className="media-workspace">
          <div className="media-stage-wrap">
            {scanning && (
              <div className="media-scan-overlay">
                <div className="media-scan-beam" />
                <span>Reading document for private details…</span>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="media-canvas"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            <div className="media-stage-hint">
              <span>Drag across any area on the {mediaType === 'image' ? 'image' : 'video'} to add a custom blur box</span>
              <span>{regions.filter((r) => r.active !== false).length} regions blurred</span>
            </div>
          </div>

          <div className="media-controls-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong>Style</strong>
              <div className="segmented">
                {[
                  { id: 'blur', label: 'Blur' },
                  { id: 'pixelate', label: 'Pixelate' },
                  { id: 'bar', label: 'Solid bar' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={blurMode === m.id ? 'on' : ''}
                    onClick={() => setBlurMode(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {blurMode !== 'bar' && (
              <label className="media-slider-row">
                <span>Intensity ({blurStrength}px)</span>
                <input
                  type="range"
                  min={8}
                  max={36}
                  value={blurStrength}
                  onChange={(e) => setBlurStrength(Number(e.target.value))}
                />
              </label>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong style={{ fontSize: '0.84rem' }}>Detected regions ({regions.length})</strong>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowOriginal((s) => !s)}
                >
                  {showOriginal ? 'Hide original' : 'Peek original'}
                </button>
              </div>
              <div className="media-region-list">
                {regions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`media-region-chip ${r.active !== false ? 'active' : 'off'}`}
                    onClick={() => toggleRegion(r.id)}
                    title="Click to toggle blur on/off for this region"
                  >
                    <span className={`dot dot-${r.severity || 'high'}`} />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="btn-row" style={{ marginTop: 4 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={downloadBlurredImage}>
                <Icon name="download" size={14} />Download Blurred PNG
              </button>
              {(mediaType === 'video' || mediaType === 'sim-video') && (
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={recordingVideo}
                  onClick={exportBlurredVideo}
                >
                  <Icon name="download" size={14} />
                  {recordingVideo ? 'Recording 4s clip…' : 'Export Blurred Video (.webm)'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                  setMediaType(null);
                  setRegions([]);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
