"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";

interface SignatureCropperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File;
  onCropComplete: (croppedFile: File) => void;
  mode?: "signature" | "document" | "photo";
}

// Checkerboard background to represent transparency in the preview
const checkerboardStyle = {
  backgroundColor: "#f8fafc",
  backgroundImage: `
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
    linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
    linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)
  `,
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
};

export function SignatureCropperModal({
  open,
  onOpenChange,
  file,
  onCropComplete,
  mode = "signature",
}: SignatureCropperModalProps) {
  const isSignature = mode === "signature";
  const isPhoto = mode === "photo";

  const [selectedRatio, setSelectedRatio] = useState<
    "4:3" | "3:2" | "1:1" | "16:9" | "3:1"
  >(isSignature ? "3:1" : isPhoto ? "1:1" : "4:3");

  // Dimensions of UI Crop Box
  const CROP_BOX_WIDTH = 300;

  let CROP_BOX_HEIGHT = 225; // default 4:3
  if (selectedRatio === "3:1") CROP_BOX_HEIGHT = 100;
  else if (selectedRatio === "3:2") CROP_BOX_HEIGHT = 200;
  else if (selectedRatio === "1:1") CROP_BOX_HEIGHT = 300;
  else if (selectedRatio === "16:9") CROP_BOX_HEIGHT = 168;

  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = Math.round(
    CROP_BOX_HEIGHT * (CANVAS_WIDTH / CROP_BOX_WIDTH),
  );

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(isSignature);
  const [contrastThreshold, setContrastThreshold] = useState(150); // range: 100 to 240, default 150 (cleaner separation by default)

  const imgRef = useRef<HTMLImageElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialOffset = useRef({ x: 0, y: 0 });

  // Load the image file as base64 data URL
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Dynamically adjust scale to cover the crop box when image size or crop box dimensions change
  useEffect(() => {
    if (imageSize.width === 0 || imageSize.height === 0) return;
    const scaleX = CROP_BOX_WIDTH / imageSize.width;
    const scaleY = CROP_BOX_HEIGHT / imageSize.height;
    const initialScale = Math.max(scaleX, scaleY);
    setBaseScale(initialScale);
  }, [CROP_BOX_HEIGHT, imageSize.width, imageSize.height]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    setImageSize({ width: naturalWidth, height: naturalHeight });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
  };

  // Dragging event handlers
  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = { x: clientX, y: clientY };
    initialOffset.current = { ...offset };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setOffset({
      x: initialOffset.current.x + dx,
      y: initialOffset.current.y + dy,
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  // Reset adjustments
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    setContrastThreshold(150);
    toast.success("Adjustments reset");
  };

  // Perform canvas cropping and output cropped file
  const handleCrop = () => {
    if (!imgRef.current) {
      toast.error("Image not loaded yet");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast.error("Failed to generate signature crop context");
      return;
    }

    // Clear canvas and fill with white.
    // White background on white document page = invisible box, AND prevents
    // @react-pdf/renderer from tiling the image (a known react-pdf bug with transparent PNGs).
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const S = canvas.width / CROP_BOX_WIDTH; // S = 2 — ratio of output canvas to UI crop box

    // 1. Move context origin to the center of the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // 2. Translate by the dragged offset, converted to canvas pixel units
    ctx.translate(offset.x * S, offset.y * S);

    // 3. Rotate around the new center
    ctx.rotate((rotation * Math.PI) / 180);

    // 4. Scale by zoom only — S is already baked into drawWidth/drawHeight below
    ctx.scale(zoom, zoom);

    // 5. Draw image in canvas-pixel units.
    //    baseScale fills the 300px UI crop box, so multiply by S to get canvas pixels.
    //    This means ctx.drawImage draws the image at the correct canvas size,
    //    and zoom applies uniformly without accidentally doubling the image.
    const drawWidth = imageSize.width * baseScale * S;
    const drawHeight = imageSize.height * baseScale * S;
    ctx.drawImage(
      imgRef.current,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight,
    );

    // Isolate signature ink — make background white (not transparent).
    // Transparent PNGs cause @react-pdf/renderer to tile the image (rendering it twice).
    // White background is invisible on the document's white pages.
    if (removeBackground) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const thresholdBg = contrastThreshold;
      const thresholdFg = Math.max(0, contrastThreshold - 30);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Already transparent — make white (canvas was pre-filled white, so this shouldn't occur)
        if (a === 0) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
          continue;
        }

        // Calculate luminance (brightness)
        const v = 0.299 * r + 0.587 * g + 0.114 * b;

        if (v >= thresholdBg) {
          // Light / background pixel → clean white (matches document background)
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = 255;
        } else {
          // Dark ink pixel → black/dark gray, fully opaque
          let ratio = 1;
          if (v > thresholdFg) {
            ratio = (thresholdBg - v) / (thresholdBg - thresholdFg);
          }
          const grayValue = Math.round(255 * (1 - ratio));
          data[i] = grayValue;
          data[i + 1] = grayValue;
          data[i + 2] = grayValue;
          data[i + 3] = 255; // fully opaque — no transparency that could confuse react-pdf
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Convert to png
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Error cropping image");
        return;
      }
      // Ensure the filename has a .png extension to match the PNG mime type
      const lastDotIndex = file.name.lastIndexOf(".");
      const baseName =
        lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
      const pngName = `${baseName}.png`;

      const croppedFile = new File([blob], pngName, { type: "image/png" });
      onCropComplete(croppedFile);
    }, "image/png");
  };

  const renderedWidth = imageSize.width * baseScale;
  const renderedHeight = imageSize.height * baseScale;

  // Calculate opacity/contrast filter for the real-time preview
  const previewFilter = removeBackground
    ? `grayscale(1) contrast(${1 + (240 - contrastThreshold) / 100}) brightness(${1.0 + (180 - contrastThreshold) / 350})`
    : "none";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-6 gap-6 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in-50 zoom-in-95 duration-200">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {isSignature
              ? "Adjust Signature"
              : isPhoto
                ? "Adjust Passport Photo"
                : "Adjust Document"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {isSignature
              ? "Adjust your signature to fit perfectly in the box. Drag to move, use sliders to zoom, rotate, and clean background."
              : isPhoto
                ? "Adjust your photo to fit inside the square. Drag to move, use sliders to zoom and rotate."
                : "Adjust your document image to fit inside the crop box. Drag to move, use sliders to zoom and rotate."}
          </DialogDescription>
        </DialogHeader>

        {/* Viewport & Crop area */}
        <div
          style={{
            ...(removeBackground ? checkerboardStyle : {}),
            height: isSignature ? "220px" : isPhoto ? "360px" : "300px",
          }}
          className="relative w-full bg-slate-950/95 dark:bg-black rounded-xl overflow-hidden flex items-center justify-center select-none border border-slate-200 dark:border-slate-800"
        >
          {imageSrc ? (
            <div
              className="absolute inset-0 flex items-center justify-center touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleEnd}
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt={
                  isSignature
                    ? "Signature to adjust"
                    : isPhoto
                      ? "Photo to adjust"
                      : "Document to adjust"
                }
                onLoad={handleImageLoad}
                style={{
                  width: `${renderedWidth}px`,
                  height: `${renderedHeight}px`,
                  transform: `translate(-50%, -50%) translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                  mixBlendMode: removeBackground ? "multiply" : "normal",
                  filter: previewFilter,
                }}
                className={`absolute left-1/2 top-1/2 select-none pointer-events-none transition-all duration-75 ${
                  isDragging ? "cursor-grabbing" : "cursor-grab"
                }`}
              />
            </div>
          ) : (
            <div className="text-slate-400 text-xs animate-pulse">
              Loading image...
            </div>
          )}

          {/* Semi-transparent dark overlay with center clear box */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {/* Top mask */}
            <div className="flex-1 bg-black/60 w-full" />
            <div
              className="flex w-full"
              style={{ height: `${CROP_BOX_HEIGHT}px` }}
            >
              {/* Left mask */}
              <div className="bg-black/60 flex-1" />
              {/* Crop box cutout */}
              <div
                style={{
                  width: `${CROP_BOX_WIDTH}px`,
                  height: `${CROP_BOX_HEIGHT}px`,
                }}
                className="border-2 border-dashed border-emerald-500 rounded-md relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              >
                {/* Subtle visual guides */}
                <div className="absolute top-1 left-2 text-[9px] font-semibold text-emerald-400/90 tracking-wide uppercase">
                  {isSignature
                    ? "Signature Area"
                    : isPhoto
                      ? "Photo Crop Area"
                      : "Document Crop Area"}
                </div>
                <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-semibold text-emerald-400/80">
                  <Move className="w-2.5 h-2.5" /> Drag to adjust
                </div>
              </div>
              {/* Right mask */}
              <div className="bg-black/60 flex-1" />
            </div>
            {/* Bottom mask */}
            <div className="flex-1 bg-black/60 w-full" />
          </div>
        </div>

        {/* Sliders and Controls */}
        <div className="space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-slate-400" /> Zoom
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {zoom.toFixed(1)}x
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setZoom((prev) =>
                    Math.max(0.5, parseFloat((prev - 0.2).toFixed(2))),
                  )
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <button
                type="button"
                onClick={() =>
                  setZoom((prev) =>
                    Math.min(4, parseFloat((prev + 0.2).toFixed(2))),
                  )
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rotation Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-slate-400" /> Rotation
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {rotation}°
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRotation((prev) => Math.max(-180, prev - 15))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0"
                title="Rotate Counter-Clockwise"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <button
                type="button"
                onClick={() => setRotation((prev) => Math.min(180, prev + 15))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer shrink-0"
                title="Rotate Clockwise"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Aspect Ratio Selector (Only shown for documents/photos) */}
          {!isSignature && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-200">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["4:3", "3:2", "1:1", "16:9"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setSelectedRatio(ratio)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      selectedRatio === ratio
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remove Background Toggle (Only shown for Signature) */}
          {isSignature && (
            <>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 animate-in fade-in-50 duration-200">
                <div className="space-y-0.5">
                  <label
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                    htmlFor="remove-bg"
                  >
                    Clean Background (Solid White)
                  </label>
                  <p className="text-[10px] text-slate-400">
                    Isolates signature ink and removes paper background
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="remove-bg"
                  checked={removeBackground}
                  onChange={(e) => setRemoveBackground(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Ink Sensitivity (Threshold) Slider */}
              {removeBackground && (
                <div className="space-y-1.5 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />{" "}
                      Background Cleaning Sensitivity
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {((240 - contrastThreshold) / 1.4).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 shrink-0 select-none">
                      Less Clean
                    </span>
                    <input
                      type="range"
                      min="100"
                      max="240"
                      step="2"
                      value={contrastThreshold}
                      onChange={(e) =>
                        setContrastThreshold(parseInt(e.target.value))
                      }
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-400 shrink-0 select-none">
                      More Clean
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-800 h-9 px-3 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-slate-500 hover:text-slate-800 h-9 px-3 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCrop}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 rounded-xl shadow-md shadow-emerald-500/10"
            >
              Crop & Upload
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
