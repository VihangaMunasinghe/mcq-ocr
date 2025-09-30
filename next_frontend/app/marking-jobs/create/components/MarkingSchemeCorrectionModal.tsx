import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../../../../components/UI/Button";
import { AnswerSheetViewer } from "../../../../components/UI/AnswerSheetViewer";
import { Bubble } from "../../types/types";

interface AnswersCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  bubbleData: Bubble[][];
  confirmText?: string;
  onConfirm?: (isUpdated: boolean, updatedBubbleData: Bubble[][]) => void;
}

const AnswersCorrectionModal = ({
  isOpen,
  onClose,
  imageUrl,
  bubbleData,
  confirmText,
  onConfirm: onConfirm,
}: AnswersCorrectionModalProps) => {
  const [localBubbleData, setLocalBubbleData] =
    useState<Bubble[][]>(bubbleData);
  const [showAllBubbles, setShowAllBubbles] = useState(true);

  const handleBubbleToggle = (questionIndex: number, optionIndex: number) => {
    const newData = [...localBubbleData];
    newData[questionIndex][optionIndex].marked =
      !newData[questionIndex][optionIndex].marked;
    setLocalBubbleData(newData);
  };

  const handleSave = () => {
    let isUpdated = false;
    for (
      let questionIndex = 0;
      questionIndex < localBubbleData.length;
      questionIndex++
    ) {
      for (
        let optionIndex = 0;
        optionIndex < localBubbleData[questionIndex].length;
        optionIndex++
      ) {
        if (
          localBubbleData[questionIndex][optionIndex].marked !==
          bubbleData[questionIndex][optionIndex].marked
        ) {
          isUpdated = true;
          break;
        }
      }
    }
    onConfirm?.(isUpdated, localBubbleData);
    onClose();
  };

  const handleCancel = useCallback(() => {
    setLocalBubbleData(bubbleData); // Reset to original data
    onClose();
  }, [bubbleData, onClose]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleCancel]);

  // Calculate statistics
  const totalBubbles = localBubbleData.reduce(
    (total, question) => total + question.length,
    0
  );
  const markedBubbles = localBubbleData.reduce(
    (total, question) =>
      total + question.filter((bubble) => bubble.marked).length,
    0
  );

  const footer = (
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-600">
        {markedBubbles} of {totalBubbles} bubbles marked
      </div>
      <div className="flex space-x-3">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          {confirmText || "Save Changes"}
        </Button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-start justify-center p-4 transition-opacity">
      <div className="w-full max-w-none bg-white rounded-lg shadow-xl transform transition-all">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              Correct Answer Bubbles
            </h3>
            <button
              onClick={() => setShowAllBubbles(!showAllBubbles)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showAllBubbles ? "Hide All Bubbles" : "Show All Bubbles"}
            </button>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className="p-4 overflow-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <AnswerSheetViewer
            imageUrl={imageUrl}
            bubbleData={localBubbleData}
            onBubbleToggle={handleBubbleToggle}
            showBubbles={showAllBubbles}
            isInteractive={true}
            width={1200}
            height={1600}
            isMarkingScheme={true}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
          {footer}
        </div>
      </div>
    </div>
  );
};

export default AnswersCorrectionModal;
