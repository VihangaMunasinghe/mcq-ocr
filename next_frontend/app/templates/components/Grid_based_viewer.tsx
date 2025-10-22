import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";

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

interface SelectedColumn {
  key: string;
  originalPosition: ColumnStart;
}

const Grid_based_viewer: React.FC<GridBasedViewerProps> = ({
  templateImage,
  configData,
  configId,
  jobId,
  onClose,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState<number>(1);

  const [columns, setColumns] = useState<Record<string, ColumnStart>>({});
  const [xOffset, setXOffset] = useState<number>(0);
  const [yOffset, setYOffset] = useState<number>(0);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<SelectedColumn | null>(
    null
  );
  const [draggedColumn, setDraggedColumn] = useState<SelectedColumn | null>(
    null
  );
  const [hoverColumnKey, setHoverColumnKey] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );

  const [isSaving, setIsSaving] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const CLICK_COOLDOWN = 300; // milliseconds
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
    const radius = isHovered ? 10 : 8;
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
    // Horizontal line
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ff0000";
    ctx.setLineDash([]);
    ctx.moveTo(sx * scale, sy * scale);
    ctx.lineTo((sx + xOff) * scale, sy * scale);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ff0000";
    ctx.setLineDash([]);
    ctx.moveTo(sx * scale, sy * scale);
    ctx.lineTo(sx * scale, (sy + yOff) * scale);
    ctx.stroke();
  };

  // === Mouse / Drag logic (EXACTLY like cluster-based) ===
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    // Prevent double-click issues
    const now = Date.now();
    if (now - lastClickTime < CLICK_COOLDOWN) {
      return;
    }
    setLastClickTime(now);

    const pt = getCanvasCoords(e);
    if (!pt) return;

    const hit = hitTest(pt.x, pt.y);
    if (!hit) return;

    // Find and select the column
    const selected: SelectedColumn = {
      key: hit,
      originalPosition: { ...columns[hit] },
    };

    setSelectedColumn(selected);
    setDragStartPos(pt);
    // Don't set isDragging or draggedColumn yet - wait for actual movement
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    // Check if we should start dragging
    if (selectedColumn && dragStartPos && !isDragging) {
      const dist = Math.hypot(pt.x - dragStartPos.x, pt.y - dragStartPos.y);
      if (dist > DRAG_THRESHOLD) {
        setIsDragging(true);
        setDraggedColumn(selectedColumn);
      }
    }

    // Hover detection (only when not dragging) - adjusted for scale
    if (!isDragging) {
      let foundHover = false;
      const hoverRadius = 10 / scale; // Convert screen pixels to image coordinates
      for (const key of Object.keys(columns)) {
        const s = columns[key];
        const dist = Math.hypot(s.starting_x - pt.x, s.starting_y - pt.y);
        if (dist < hoverRadius && !foundHover) {
          setHoverColumnKey(key);
          foundHover = true;
          break;
        }
      }
      if (!foundHover) setHoverColumnKey(null);
    }

    if (isDragging && selectedColumn) {
      setMousePos(pt);
      setColumns((prev) => {
        const next = { ...prev };
        next[selectedColumn.key] = {
          starting_x: parseFloat(pt.x.toFixed(2)),
          starting_y: parseFloat(pt.y.toFixed(2)),
        };
        return next;
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || !selectedColumn) {
      // Reset states if drag didn't actually happen
      setSelectedColumn(null);
      setDraggedColumn(null);
      setDragStartPos(null);
      return;
    }

    // Finalize the position
    setIsDragging(false);
    setSelectedColumn(null);
    setDraggedColumn(null);
    setMousePos(null);
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

      await axiosInstance.put("/api/files/update-config", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

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
      const response = await axiosInstance.get(
        `/api/templates/config-job/${jobId}`
      );

      const uploadData: ConfigJobResponse = response.data as ConfigJobResponse;
      const TemRecordId = uploadData.template_id;
      await axiosInstance.delete(`/api/templates/${TemRecordId}`);

      showToast("You can re-enter again!", "success");
      onClose();

      setTimeout(() => {
        router.push("/templates/create?reset=true");
      }, 100);
    } catch (error) {
      console.error(
        "Error while getting configJob record ID or deleting template:",
        error
      );
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

          // Skip drawing the bubble being dragged at its original position
          if (draggedColumn && k === draggedColumn.key) {
            // Don't draw it here, we'll draw it at mouse position
            drawGuides(ctx, s.starting_x, s.starting_y, xOffset, yOffset);
            return;
          }

          drawGuides(ctx, s.starting_x, s.starting_y, xOffset, yOffset);
          const isHover = hoverColumnKey === k && !isDragging;
          drawTopBubble(ctx, s.starting_x, s.starting_y, "#2BFA0B", isHover);
        });

        // Draw the dragging bubble in blue at mouse position
        if (isDragging && mousePos && draggedColumn) {
          drawTopBubble(ctx, mousePos.x, mousePos.y, "#0000ff", false);
        }
      };

      render();
    };
  }, [templateImage, configData, columns, xOffset, yOffset, hoverColumnKey, isDragging, mousePos, draggedColumn, drawGuides, drawTopBubble]);

  return (
    <div className="relative w-full h-full flex">
      {/* Canvas */}
      <div className="flex-1 flex justify-center items-start p-6 bg-gray-50">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-xl shadow-lg cursor-pointer bg-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
        </div>
      </div>

      {/* Sidebar - Right Side */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 rounded-lg p-2 mr-3">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </span>
              Grid Configuration
            </h3>

            {configData?.metadata && (
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      Total Questions
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg font-semibold">
                      {configData.metadata.num_questions}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      Options per Question
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-semibold">
                      {configData.metadata.num_of_options_per_question}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">
                      Row Distribution
                    </span>
                  </div>
                  <div className="space-y-2">
                    {configData.metadata.column_row_distribution.map(
                      (rows, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            Column {idx + 1}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md font-medium">
                            {rows} rows
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-orange-100 text-orange-600 rounded-lg p-2 mr-3">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </span>
              Global Offsets
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  X Offset
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={xOffset.toFixed(2)}
                  onChange={(e) => handleXOffsetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Y Offset
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={yOffset.toFixed(2)}
                  onChange={(e) => handleYOffsetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 <strong>Tip:</strong> Double-click a green bubble and drag
                (without releasing after 2nd click) to move it (turns blue).
                Release to finalize (turns green again).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors ${
              isSaving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
            }`}
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            onClick={handleEdit}
            className="w-full py-3 px-4 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            Edit Configuration
          </button>
          <button
            onClick={handleOk}
            className="w-full py-3 px-4 rounded-xl border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Grid_based_viewer;
