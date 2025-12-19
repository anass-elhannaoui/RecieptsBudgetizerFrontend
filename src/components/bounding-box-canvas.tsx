"use client";

import { useEffect, useRef, useState } from "react";
import { OcrData } from "@/lib/types";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";

interface BoundingBoxCanvasProps {
  imageUrl: string;
  ocrData?: OcrData[];
  className?: string;
}

export function BoundingBoxCanvas({ imageUrl, ocrData, className = "" }: BoundingBoxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("🔍 BoundingBoxCanvas received:", {
      imageUrl,
      ocrDataLength: ocrData?.length || 0,
      hasOcrData: !!ocrData,
      ocrData: ocrData
    });
  }, [imageUrl, ocrData]);

  // Get color based on confidence level
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'rgba(34, 197, 94, 0.8)';   // Green - high confidence
    if (confidence >= 0.7) return 'rgba(251, 146, 60, 0.8)'; // Orange - medium confidence
    return 'rgba(239, 68, 68, 0.8)';                         // Red - low confidence
  };

  // Check if point is inside polygon
  const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];
      
      const intersect = ((yi > point[1]) !== (yj > point[1]))
        && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = () => {
    console.log("🎨 drawBoundingBoxes called:", {
      hasCanvas: !!canvasRef.current,
      hasImage: !!imageRef.current,
      hasOcrData: !!ocrData,
      ocrDataLength: ocrData?.length,
      imageLoaded,
      showBoxes
    });

    if (!canvasRef.current || !imageRef.current || !ocrData || !imageLoaded || !showBoxes) {
      console.log("⚠️ Skipping draw - missing requirements");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    console.log("✅ Drawing boxes:", {
      imageSize: `${img.naturalWidth}x${img.naturalHeight}`,
      boxCount: ocrData.length,
      firstBox: ocrData[0]
    });

    // Set canvas size to match image natural dimensions
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw bounding boxes
    ocrData.forEach((item, index) => {
      const box = item.bounding_box;
      const isHovered = index === hoveredIndex;
      const color = getConfidenceColor(item.confidence);

      console.log(`  📦 Box ${index}:`, box, `confidence: ${item.confidence}`);

      // Draw polygon
      ctx.beginPath();
      ctx.moveTo(box.top_left[0], box.top_left[1]);
      ctx.lineTo(box.top_right[0], box.top_right[1]);
      ctx.lineTo(box.bottom_right[0], box.bottom_right[1]);
      ctx.lineTo(box.bottom_left[0], box.bottom_left[1]);
      ctx.closePath();

      // Style the box
      ctx.strokeStyle = isHovered ? 'rgba(255, 255, 0, 0.95)' : color;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Fill hovered box with semi-transparent overlay
      if (isHovered) {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.15)';
        ctx.fill();

        // Draw tooltip background
        const tooltipText = `"${item.text}" - ${(item.confidence * 100).toFixed(1)}%`;
        ctx.font = 'bold 14px Arial';
        const textWidth = ctx.measureText(tooltipText).width;
        const tooltipHeight = 24;
        const tooltipPadding = 8;
        const tooltipY = box.top_left[1] - tooltipHeight - 8;

        // Draw rounded rectangle for tooltip
        const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        };

        drawRoundedRect(
          box.top_left[0] - tooltipPadding,
          tooltipY,
          textWidth + tooltipPadding * 2,
          tooltipHeight,
          6
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fill();

        // Draw tooltip text
        ctx.fillStyle = 'white';
        ctx.fillText(tooltipText, box.top_left[0], tooltipY + 17);
      } else {
        // Draw small confidence label
        ctx.fillStyle = color;
        ctx.font = '11px Arial';
        ctx.fillText(
          `${(item.confidence * 100).toFixed(0)}%`,
          box.top_left[0],
          box.top_left[1] - 5
        );
      }
    });
  };

  // Handle mouse movement for hover effect
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !ocrData || !showBoxes) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get mouse position relative to canvas
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find if mouse is inside any bounding box
    const newHoveredIndex = ocrData.findIndex((item) => {
      const box = item.bounding_box;
      return isPointInPolygon([x, y], [
        box.top_left,
        box.top_right,
        box.bottom_right,
        box.bottom_left
      ]);
    });

    if (newHoveredIndex !== hoveredIndex) {
      setHoveredIndex(newHoveredIndex);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };

  // Handle image load
  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      
      if (img.complete) {
        setImageLoaded(true);
      } else {
        img.onload = () => {
          setImageLoaded(true);
        };
      }
    }
  }, [imageUrl]);

  // Redraw when dependencies change
  useEffect(() => {
    drawBoundingBoxes();
  }, [ocrData, imageLoaded, showBoxes, hoveredIndex]);

  // Don't render if no OCR data
  if (!ocrData || ocrData.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden image for loading */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Receipt"
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />
      
      {/* Canvas for drawing */}
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg object-contain cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Toggle button */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBoxes(!showBoxes)}
          className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white border border-slate-200"
          title={showBoxes ? "Hide OCR boxes" : "Show OCR boxes"}
        >
          {showBoxes ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide Boxes
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show Boxes
            </>
          )}
        </Button>
      </div>

      {/* Legend */}
      {showBoxes && (
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-3 text-xs z-10 border border-slate-200">
          <div className="font-semibold mb-2 text-slate-700">OCR Confidence</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: 'rgba(34, 197, 94, 0.8)' }}></div>
              <span className="text-slate-600">High (&gt;90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: 'rgba(251, 146, 60, 0.8)' }}></div>
              <span className="text-slate-600">Medium (70-90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" style={{ borderColor: 'rgba(239, 68, 68, 0.8)' }}></div>
              <span className="text-slate-600">Low (&lt;70%)</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 text-slate-500">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{ocrData.length}</span> text regions detected
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
