import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../hooks/useToast";

interface ColumnStart {
  starting_x: number;
  starting_y: number;
}

interface BubbleConfigs {
  x_offset: number;
  y_offset: number;
  columns: Record<string, ColumnStart>;
}

interface GridConfigData {
  metadata: {
    num_questions: number;
    column_row_distribution: number[];
    num_of_options_per_question: number;
  };
  bubble_configs: BubbleConfigs;
}

interface GridBasedViewerProps {
  templateImage: string | null;
  configData: GridConfigData | null;
  configId: string | null;
  jobId: number | null;
  onClose: () => void;
}

interface ConfigJobResponse {
  template_id: number;
}

const Grid_based_viewer: React.FC<GridBasedViewerProps> = ({
  templateImage,
  configData,
  configId,
  jobId,
  onClose
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState<number>(1);

  const [columns, setColumns] = useState<Record<string, ColumnStart>>({});
  const [xOffset, setXOffset] = useState<number>(0);
  const [yOffset, setYOffset] = useState<number>(0);

  const [isDragging, setIsDragging] = useState(false);
  const [activeColumnKey, setActiveColumnKey] = useState<string | null>(null);
  const [hoverColumnKey, setHoverColumnKey] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const DOUBLE_CLICK_THRESHOLD = 300; // milliseconds
  const DRAG_THRESHOLD = 5; // pixels
  const originalConfigString = JSON.stringify(configData);

  // === Utility functions ===
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    return { x: x / scale, y: y / scale };
  };

  const hitTest = (x: number, y: number) => {
    const hitRadius = 15;
    for (const key of Object.keys(columns)) {
      const s = columns[key];
      const dist = Math.hypot(s.starting_x - x, s.starting_y - y);
      if (dist <= hitRadius) return key;
    }
    return null;
  };

  // === Canvas Drawing ===
  const drawTopBubble = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    isHovered = false
  ) => {
    const radius = isHovered ? 8 : 6;
    ctx.beginPath();
    ctx.arc(x * scale, y * scale, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  };

  const drawGuides = (
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    xOff: number,
    yOff: number
  ) => {
    // Horizontal line (solid red, thicker)
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ff0000";
    ctx.setLineDash([]);
    ctx.moveTo(sx * scale, sy * scale);
    ctx.lineTo((sx + xOff) * scale, sy * scale);
    ctx.stroke();

    // Vertical line (solid red, thicker)
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ff0000";
    ctx.setLineDash([]);
    ctx.moveTo(sx * scale, sy * scale);
    ctx.lineTo(sx * scale, (sy + yOff) * scale);
    ctx.stroke();
  };

  // === Mouse / Drag logic ===
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);
    if (!pt) return;
    const hit = hitTest(pt.x, pt.y);
    if (!hit) return;

    // Toggle activation
    if (activeColumnKey === hit) {
      setActiveColumnKey(null); // deactivate
    } else {
      setActiveColumnKey(hit); // activate
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);
    if (!pt) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // Check if this is a double-click
    if (timeSinceLastClick < DOUBLE_CLICK_THRESHOLD) {
      // This is the second click of a double-click
      // Don't start dragging, let handleDoubleClick handle it
      setLastClickTime(0); // Reset to prevent triple-click issues
      return;
    }

    setLastClickTime(now);

    const hit = hitTest(pt.x, pt.y);
    if (!hit || hit !== activeColumnKey) return;

    // Only allow dragging the active column
    setDragStartPos(pt);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoords(e);
    if (!pt) return;
    setMousePos(pt);

    const hit = hitTest(pt.x, pt.y);
    setHoverColumnKey(hit);

    // Check if we should start dragging
    if (dragStartPos && !isDragging && activeColumnKey) {
      const dist = Math.hypot(pt.x - dragStartPos.x, pt.y - dragStartPos.y);
      if (dist > DRAG_THRESHOLD) {
        setIsDragging(true);
      }
    }

    // Update position while dragging
    if (isDragging && activeColumnKey) {
      setColumns((prev) => {
        const next = { ...prev };
        next[activeColumnKey] = {
          starting_x: parseFloat(pt.x.toFixed(2)),
          starting_y: parseFloat(pt.y.toFixed(2)),
        };
        return next;
      });
    }
  };

  const handleMouseUp = () => {
    // When user releases, finalize the position and deactivate
    if (isDragging && activeColumnKey) {
      // Keep the bubble in its current position
      // Deactivate it (turn it back to green)
      setActiveColumnKey(null);
    }
    
    setIsDragging(false);
    setDragStartPos(null);
  };

  // === Save logic ===
  const handleSubmit = async () => {
    if (!configData || isSaving) return;
    if (!configId) {
      showToast("Invalid configuration ID", "error");
      return;
    }

    const newBubbleConfigs: BubbleConfigs = {
      x_offset: parseFloat(xOffset.toFixed(2)),
      y_offset: parseFloat(yOffset.toFixed(2)),
      columns: {},
    };

    Object.keys(columns).forEach((k) => {
      newBubbleConfigs.columns[k] = {
        starting_x: Math.round(columns[k].starting_x),
        starting_y: Math.round(columns[k].starting_y),
      };
    });

    const newConfigObj = {
      metadata: configData.metadata,
      bubble_configs: newBubbleConfigs,
    };

    const newConfigString = JSON.stringify(newConfigObj);
    console.log("Original Config:", originalConfigString);
    console.log("new configs",newConfigString)
    if (originalConfigString === newConfigString) {
      showToast("No changes detected. Redirecting...", "info");
      router.push("/templates");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("file_id", configId);
      formData.append("config_data", JSON.stringify(newConfigObj));

      const res = await fetch(`${BACKEND_URL}/api/files/update-config`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      showToast("Configuration updated successfully!", "success");
      router.push("/templates");
    } catch (err) {
      console.error(err);
      showToast("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOk = () => router.push("/templates");

  const handleEdit = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/templates/config-job/${jobId}`, {
        method: "GET"
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get template record ID: ${response.statusText}`);
      }
      
      const uploadData: ConfigJobResponse = await response.json();
      const TemRecordId = uploadData.template_id;
      const result = await fetch(`${BACKEND_URL}/api/templates/${TemRecordId}`, {
        method: "DELETE",
      });

      if (!result.ok) {
        throw new Error(`Failed to delete template: ${result.statusText}`);
      }
      
      showToast("You can re-enter again!", "success");
      onClose();
      
      setTimeout(() => {
        router.push("/templates/create?reset=true");
      }, 100);
      
    } catch (error) {
      console.error("Error while getting configJob record ID or deleting template:", error);
      showToast("Failed to remove entered template", "error");
    }
  };

  const handleXOffsetChange = (v: string) => {
    const num = parseFloat(v);
    if (!Number.isNaN(num)) setXOffset(num);
  };
  
  const handleYOffsetChange = (v: string) => {
    const num = parseFloat(v);
    if (!Number.isNaN(num)) setYOffset(num);
  };

  // === Load initial config ===
  useEffect(() => {
    if (!configData) return;
    const bc = configData.bubble_configs;
    const cols: Record<string, ColumnStart> = {};
    Object.keys(bc.columns).forEach((k) => {
      cols[k] = {
        starting_x: parseFloat(bc.columns[k].starting_x.toFixed(2)),
        starting_y: parseFloat(bc.columns[k].starting_y.toFixed(2)),
      };
    });
    setColumns(cols);
    setXOffset(parseFloat(bc.x_offset.toFixed(2)));
    setYOffset(parseFloat(bc.y_offset.toFixed(2)));
  }, [configData]);

  // === Canvas Rendering ===
  useEffect(() => {
    if (!templateImage || !configData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = templateImage;
    image.onload = () => {
      const maxWidth = 900;
      const maxHeight = 1100;
      const scaleX = maxWidth / image.width;
      const scaleY = maxHeight / image.height;
      const scaleFactor = Math.min(scaleX, scaleY, 1);
      canvas.width = image.width * scaleFactor;
      canvas.height = image.height * scaleFactor;
      setScale(scaleFactor);

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        Object.keys(columns).forEach((k) => {
          const s = columns[k];
          drawGuides(ctx, s.starting_x, s.starting_y, xOffset, yOffset);
          const isHover = hoverColumnKey === k;
          const color = k === activeColumnKey ? "#0000ff" : "#2BFA0B";
          drawTopBubble(ctx, s.starting_x, s.starting_y, color, isHover);
        });
      };

      render();
    };
  }, [
    templateImage,
    configData,
    columns,
    xOffset,
    yOffset,
    hoverColumnKey,
    activeColumnKey,
  ]);

  return (
    <div className="relative w-full h-full flex">
      {/* Sidebar */}
      <div className="w-72 p-4 border-r border-gray-200">
        <h3 className="font-semibold text-lg mb-3">Grid Based — Metadata</h3>

        {configData?.metadata && (
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-medium">Total Questions:</span>{" "}
              {configData.metadata.num_questions}
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-medium">Options per Question:</span>{" "}
              {configData.metadata.num_of_options_per_question}
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-medium">Row Distribution:</span>
              <div className="ml-2 text-sm">
                {configData.metadata.column_row_distribution.map((rows, idx) => (
                  <div key={idx}>
                    Column {idx + 1}: {rows} rows
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <h4 className="mt-4 font-medium">Offsets (Global)</h4>
        <div className="mt-2 space-y-2">
          <div className="flex items-center space-x-2">
            <label className="w-20 text-sm">x_offset</label>
            <input
              type="number"
              step="0.01"
              value={xOffset.toFixed(2)}
              onChange={(e) => handleXOffsetChange(e.target.value)}
              className="flex-1 p-1 border rounded"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="w-20 text-sm">y_offset</label>
            <input
              type="number"
              step="0.01"
              value={yOffset.toFixed(2)}
              onChange={(e) => handleYOffsetChange(e.target.value)}
              className="flex-1 p-1 border rounded"
            />
          </div>
          <div className="text-xs text-gray-500">
            Double-click a green bubble to activate (it turns blue). Then drag to
            move it. Release the mouse to finalize the position (it turns green again).
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`w-full py-2 px-4 rounded-lg shadow-md text-white ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleEdit}
            className="w-full py-2 px-4 rounded-lg border border-gray-300 mt-2 bg-red-600 hover:bg-red-800 text-white"
          >
            Edit
          </button>
          <button
            onClick={handleOk}
            className="w-full py-2 px-4 rounded-lg border border-gray-300 mt-2 bg-white"
          >
            Ok
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex justify-center items-start p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded shadow-lg"
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: activeColumnKey ? "grabbing" : hoverColumnKey ? "grab" : "default",
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Grid_based_viewer;