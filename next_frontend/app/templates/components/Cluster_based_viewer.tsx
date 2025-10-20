import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "../../../hooks/useToast";

interface BubbleCoordinate {
  x: number;
  y: number;
}

interface ColumnBounds {
  x_min: number;
  x_max: number;
  rows: {
    y_mean: number;
    y_min: number;
    y_max: number;
  }[];
}

interface SelectedBubble {
  colIndex: number;
  rowIndex: number;
  bubbleIndex: number;
  originalCoord: BubbleCoordinate;
}

interface ConfigJobResponse {
  template_id: number;
}

interface ClusterBasedViewerProps {
  templateImage: string | null;
  configData: any;
  configId: string | null;
  jobId:number|null;
  onClose: () => void;
}

const Cluster_based_viewer: React.FC<ClusterBasedViewerProps> = ({
  templateImage,
  configData,
  configId,
  jobId,
  onClose
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [columnBounds, setColumnBounds] = useState<ColumnBounds[]>([]);
  const [bubbles, setBubbles] = useState<BubbleCoordinate[][][]>([]);
  const [selectedBubble, setSelectedBubble] = useState<SelectedBubble | null>(null);
  const [draggedBubble, setDraggedBubble] = useState<SelectedBubble | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState<BubbleCoordinate | null>(null);
  const [hoveredBubble, setHoveredBubble] = useState<BubbleCoordinate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [dragStartPos, setDragStartPos] = useState<BubbleCoordinate | null>(null);
  
  const CLICK_COOLDOWN = 300; // milliseconds
  const DRAG_THRESHOLD = 5; // pixels
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  // Calculate column bounds
  const calculateBounds = (bubbleData: BubbleCoordinate[][][]) => {
    return bubbleData.map(column => {
      const allXCoords = column.flat().map(b => b.x);
      const x_min = Math.min(...allXCoords) - 10;
      const x_max = Math.max(...allXCoords) + 10;

      const rows = column.map(row => {
        const yCoords = row.map(b => b.y);
        return {
          y_mean: yCoords.reduce((a, b) => a + b, 0) / yCoords.length,
          y_min: Math.min(...yCoords) - 10,
          y_max: Math.max(...yCoords) + 10
        };
      });

      return { x_min, x_max, rows };
    });
  };

  // Find column/row position
  const findPosition = (x: number, y: number): { col: number, row: number, isNewRow: boolean } | null => {
    let targetCol = -1;
    for (let i = 0; i < columnBounds.length; i++) {
      if (x >= columnBounds[i].x_min && x <= columnBounds[i].x_max) {
        targetCol = i;
        break;
      }
    }

    if (targetCol === -1) {
      return null;
    }

    const bounds = columnBounds[targetCol];
    for (let i = 0; i < bounds.rows.length; i++) {
      if (y >= bounds.rows[i].y_min && y <= bounds.rows[i].y_max) {
        return { col: targetCol, row: i, isNewRow: false };
      }
    }

    const rowMeans = bounds.rows.map(r => r.y_mean);
    rowMeans.push(y);
    rowMeans.sort((a, b) => a - b);
    const targetRow = rowMeans.indexOf(y);

    return { col: targetCol, row: targetRow, isNewRow: true };
  };

  const handleMouseUp = () => {
    if (!isDragging || !selectedBubble || !mousePos) {
      // Reset states if drag didn't actually happen
      setSelectedBubble(null);
      setDraggedBubble(null);
      setDragStartPos(null);
      return;
    }

    const position = findPosition(Math.round(mousePos.x), Math.round(mousePos.y));

    // Create a deep copy to avoid mutating original state directly
    const newBubbles = bubbles.map(col => col.map(row => [...row]));
    
    // Remove the original bubble first
    newBubbles[selectedBubble.colIndex][selectedBubble.rowIndex].splice(
      selectedBubble.bubbleIndex, 
      1
    );

    if (!position) {
      // Outside valid column - restore to original position
      showToast("The bubble must be placed within a valid column's boundaries", "error");
      newBubbles[selectedBubble.colIndex][selectedBubble.rowIndex].splice(
        selectedBubble.bubbleIndex,
        0,
        selectedBubble.originalCoord
      );
    } else {
      const isSameRow =
        position.col === selectedBubble.colIndex &&
        position.row === selectedBubble.rowIndex;

      if (isSameRow) {
        // Same row - insert at correct position based on x-coordinate
        const newCoord = {
          x: Math.round(mousePos.x),
          y: Math.round(mousePos.y),
        };
        
        const row = newBubbles[position.col][position.row];
        const insertIndex = row.findIndex(b => b.x > newCoord.x);
        
        if (insertIndex === -1) {
          row.push(newCoord); // Add to end
        } else {
          row.splice(insertIndex, 0, newCoord); // Insert at correct position
        }
      }
      else if (position.isNewRow) {
        // New row within valid column
        newBubbles[position.col].splice(position.row, 0, [
          {
            x: Math.round(mousePos.x),
            y: Math.round(mousePos.y),
          },
        ]);
      }
      else {
        // Move to another existing row
        const maxOptions = configData.metadata.num_of_options_per_question;
        const rowLength = newBubbles[position.col][position.row].length;

        if (rowLength < maxOptions) {
          const newCoord = {
            x: Math.round(mousePos.x),
            y: Math.round(mousePos.y),
          };
          
          const row = newBubbles[position.col][position.row];
          const insertIndex = row.findIndex(b => b.x > newCoord.x);
          
          if (insertIndex === -1) {
            row.push(newCoord);
          } else {
            row.splice(insertIndex, 0, newCoord);
          }
        } else {
          // Exceeds allowed bubbles per row
          showToast(
            `Maximum ${maxOptions} bubbles allowed per row`,
            "error"
          );
          // Restore bubble to original place
          newBubbles[selectedBubble.colIndex][selectedBubble.rowIndex].splice(
            selectedBubble.bubbleIndex,
            0,
            selectedBubble.originalCoord
          );
        }
      }
    }

    // Update state safely
    setBubbles(newBubbles);
    setColumnBounds(calculateBounds(newBubbles));
    setIsDragging(false);
    setSelectedBubble(null);
    setDraggedBubble(null);
    setMousePos(null);
    setDragStartPos(null);
  };

  // Close handler
  const handleOk = () => {
    router.push("/templates");
  };

  // Edit handler
  const handleEdit =async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/templates/config-job/${jobId}`,
        {
          method:"GET"
        }
      );
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
      showToast("You can re-enter again !", "success");
      // Close the viewer FIRST to unmount TemplateBubbleViewer
      onClose();
       // Small delay to ensure cleanup, then navigate
      setTimeout(() => {
        router.push("/templates/create?reset=true");
      }, 100);
    } catch (error) {
      console.error("Error while getting configJob record ID or deleting  template:", error);
      showToast("Failed to remove entered template", "error");
    }

    };

  // Save configuration handler
  const handleSubmit = async () => {
    if (isSaving) return; // prevent multiple calls
    
    const newBubbles = bubbles.map(column =>
      column.filter(row => row.length > 0)
    );

    let isValid = true;
    let errorMessage = "";

    newBubbles.forEach((column, colIdx) => {
      column.forEach((row, rowIdx) => {
        if (row.length !== configData.metadata.num_of_options_per_question) {
          isValid = false;
          errorMessage = `Column ${colIdx + 1}, Row ${rowIdx + 1} has ${row.length} bubbles. Expected ${configData.metadata.num_of_options_per_question}`;
        }
      });
    });

    if (!isValid) {
      showToast(errorMessage, "error");
      return;
    }

    // Normalize updated bubbles to same format as original ([x, y])
    const updatedNormalized = newBubbles.map(column =>
      column.map(row =>
        row.map(coord => [coord.x, coord.y])
      )
    );

    // Check if there are changes
    const original = JSON.stringify(configData.bubbles);
    const updated = JSON.stringify(updatedNormalized);
    
    if (original === updated) {
      showToast("No changes detected. Redirecting...", "info");
      router.push("/templates");
      return;
    }
  
    if (!configId) {
      showToast("Invalid configuration ID", "error");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("file_id", configId);
      formData.append(
        "config_data",
        JSON.stringify({
          metadata: configData.metadata,
          bubbles: updatedNormalized
        })
      );

      const response = await fetch(`${BACKEND_URL}/api/files/update-config`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to update configuration: " + errorText);
      }

      showToast("Configuration updated successfully!", "success");
      router.push("/templates");
    } catch (error) {
      console.error(error);
      showToast("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Draw bubble helper
  const drawBubble = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color = '#2BFA0B',
    isHovered = false
  ) => {
    const radius = isHovered ? 7 : 5;
    ctx.beginPath();
    ctx.arc(x * scale, y * scale, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    // Prevent double-click issues
    const now = Date.now();
    if (now - lastClickTime < CLICK_COOLDOWN) {
      return;
    }
    setLastClickTime(now);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    let minDist = Infinity;
    let selected: SelectedBubble | null = null;

    bubbles.forEach((column, colIdx) => {
      column.forEach((row, rowIdx) => {
        row.forEach((bubble, bubbleIdx) => {
          const dist = Math.hypot(bubble.x - x, bubble.y - y);
          if (dist < minDist && dist < 10) {
            minDist = dist;
            selected = {
              colIndex: colIdx,
              rowIndex: rowIdx,
              bubbleIndex: bubbleIdx,
              originalCoord: { ...bubble }
            };
          }
        });
      });
    });

    if (selected !== null) {
      setSelectedBubble(selected);
      setDragStartPos({ x, y });
      // Don't set isDragging or draggedBubble yet - wait for actual movement
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    // Check if we should start dragging
    if (selectedBubble && dragStartPos && !isDragging) {
      const dist = Math.hypot(mouseX - dragStartPos.x, mouseY - dragStartPos.y);
      if (dist > DRAG_THRESHOLD) {
        setIsDragging(true);
        setDraggedBubble(selectedBubble);
      }
    }

    // Hover detection (only when not dragging)
    if (!isDragging) {
      let foundHover = false;
      bubbles.forEach(column => {
        column.forEach(row => {
          row.forEach(bubble => {
            const dist = Math.hypot(bubble.x - mouseX, bubble.y - mouseY);
            if (dist < 8 && !foundHover) {
              setHoveredBubble(bubble);
              foundHover = true;
            }
          });
        });
      });
      if (!foundHover) setHoveredBubble(null);
    }

    if (isDragging) {
      setMousePos({ x: mouseX, y: mouseY });
    }
  };

  useEffect(() => {
    if (!templateImage || !configData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.src = templateImage;

    image.onload = () => {
      const maxWidth = 800;
      const maxHeight = 1000;
      const scaleX = maxWidth / image.width;
      const scaleY = maxHeight / image.height;
      const scaleFactor = Math.min(scaleX, scaleY);

      canvas.width = image.width * scaleFactor;
      canvas.height = image.height * scaleFactor;
      setScale(scaleFactor);

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw all bubbles except the one being dragged
        bubbles.forEach((column, colIdx) => {
          column.forEach((row, rowIdx) => {
            row.forEach((bubble, bubbleIdx) => {
              // Skip if this is the bubble being dragged
              if (draggedBubble && 
                  colIdx === draggedBubble.colIndex && 
                  rowIdx === draggedBubble.rowIndex && 
                  bubbleIdx === draggedBubble.bubbleIndex) {
                return;
              }
              const isHovered = hoveredBubble === bubble;
              drawBubble(ctx, bubble.x, bubble.y, '#2BFA0B', isHovered);
            });
          });
        });

        // Draw the dragging bubble in red
        if (isDragging && mousePos) {
          drawBubble(ctx, mousePos.x, mousePos.y, '#F60D0D');
        }
      };

      draw();
    };
  }, [templateImage, configData, scale, bubbles, isDragging, mousePos, hoveredBubble, draggedBubble]);

  useEffect(() => {
    if (!configData?.bubbles) return;

    const initialBubbles = configData.bubbles.map((column: any[]) =>
      column.map((row: any[]) =>
        row.map((coord: number[]) => ({
          x: coord[0],
          y: coord[1]
        }))
      )
    );
    setBubbles(initialBubbles);
    setColumnBounds(calculateBounds(initialBubbles));
  }, [configData]);

  return (
    <div className="relative w-full h-full flex">
      <div className="w-64 p-4 border-r border-gray-200">
        <h3 className="font-semibold text-lg mb-3">Submitted Metadata</h3>
        {configData?.metadata && (
          <div className="space-y-2">
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-medium">Columns:</span> {configData.metadata.num_columns}
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-medium">Options per Question:</span> {configData.metadata.num_of_options_per_question}
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="font-medium">Row Distribution:</span>
              <div className="ml-2 text-sm">
                {configData.metadata.column_row_distribution.map((rows: number, idx: number) => (
                  <div key={idx}>Column {idx + 1}: {rows} rows</div>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500">
            Double-click a green bubble and drag (without releasing after 2nd click) to move it (turns blue). Release to a valid location (turns green again).
            </div>
          </div>
        )}

        <button
          onClick={() => handleSubmit()}
          disabled={isSaving}
          className={`mt-6 w-full py-2 px-4 rounded-lg shadow-md text-white ${
            isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
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
          className="w-full py-2 px-4 rounded-lg border border-gray-300 mt-2 bg-white hover:bg-gray-100"
        >
          Ok
        </button>
      </div>

      <div className="flex-1 flex justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded shadow-lg cursor-pointer"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
};

export default Cluster_based_viewer;