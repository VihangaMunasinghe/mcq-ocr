import React, { useState, useEffect, useCallback } from "react";
import { AnswerSheetViewer } from "@/components/UI/AnswerSheetViewer";
import { Button } from "@/components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Bubble, StudentResult } from "@/app/marking-jobs/types/types";

interface AnswerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: StudentResult;
  updateResult: (result: StudentResult) => void;
  markingScheme: Bubble[][];
}

const AnswerSheetModal = ({
  isOpen,
  onClose,
  result,
  updateResult,
  markingScheme,
}: AnswerSheetModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localResult, setLocalResult] = useState<StudentResult>(result);

  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Here you would typically save the changes to the backend
    console.log("Saving index number change:", localResult.index_number);
    updateResult(localResult);
    setIsEditing(false);
  };

  const handleCancel = useCallback(() => {
    setLocalResult(result);
    setIsEditing(false);
  }, [result]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isEditing) {
          handleCancel();
        } else {
          onClose();
        }
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
  }, [isOpen, isEditing, handleCancel, onClose]);

  const answerSheetPath = result.answer_sheet_path
    ? `${BACKEND_URL}/api/files/download?method=path&path=${result.answer_sheet_path}`
    : "";

  if (!isOpen) return null;

  function handleBubbleToggle(
    questionIndex: number,
    optionIndex: number
  ): void {
    const newData = [...(localResult.labeled_points || [])];
    newData[questionIndex][optionIndex].marked =
      !newData[questionIndex][optionIndex].marked;
    
    setLocalResult({ ...localResult, labeled_points: newData });
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-0 transition-opacity h-screen w-screen">
      <div className="w-[90vw] h-[90vh] max-w-none bg-white rounded-lg shadow-xl transform transition-all flex flex-col m-10 min-h-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-medium text-gray-900">
            Answer Sheet: {localResult.index_number}
          </h3>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "4px",
              color: "#9CA3AF",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => {
              console.log("Close button clicked in modal");
              onClose();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#374151";
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9CA3AF";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden min-h-0">
          <div className="grid grid-cols-5 gap-6 h-full min-h-0">
            {/* Left Column - Answer Sheet Viewer */}
            <div className="col-span-3 h-full min-h-0">
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 h-full overflow-auto">
                {localResult.answer_sheet_path ? (
                  <div className="min-w-max">
                    <AnswerSheetViewer
                      imageUrl={answerSheetPath}
                      bubbleData={localResult.labeled_points || []}
                      onBubbleToggle={handleBubbleToggle}
                      showBubbles={true}
                      isInteractive={isEditing}
                      width={1200}
                      height={1600} 
                      isMarkingScheme={false}
                      markingScheme={markingScheme}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No answer sheet image available
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Answer Sheet Data */}
            <div className="col-span-2 h-full flex flex-col min-h-0">
              <div className="bg-white border border-gray-200 rounded-md p-6 flex-1 overflow-auto min-h-0">
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Answer Sheet Data
                  </h3>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Index Number - Only editable field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Index Number
                    </label>
                    <input
                      type="text"
                      value={localResult.index_number}
                      onChange={(e) => setLocalResult({ ...localResult, index_number: e.target.value })}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        !isEditing ? "bg-gray-50 text-gray-600" : "bg-white"
                      }`}
                    />
                  </div>

                  {/* Flag Status - Badge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flag Status
                    </label>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          localResult.flag
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {localResult.flag ? "Flagged" : "Not Flagged"}
                      </span>
                    </div>
                  </div>

                  {/* Flag Reason - Always show if exists */}
                  {localResult.flag_reason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Flag Reason
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                        {localResult.flag_reason}
                      </div>
                    </div>
                  )}

                  {/* Read-only Information Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Correct Answers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correct Answers
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                        {localResult.correct}
                      </div>
                    </div>

                    {/* Incorrect Answers */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Incorrect Answers
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                        {localResult.incorrect}
                      </div>
                    </div>

                    {/* Duplicated */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duplicated
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                        {localResult.more_than_one_marked}
                      </div>
                    </div>

                    {/* Not Marked */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Not Marked
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                        {localResult.not_marked}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Score
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                      {localResult.score}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Row Number
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                        {localResult.row_number}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Questions
                      </label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                        {localResult.correct +
                          localResult.incorrect +
                          localResult.more_than_one_marked +
                          localResult.not_marked}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Button Section */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSave}
                          size="md"
                          variant="primary"
                        >
                          <FontAwesomeIcon icon={faSave} className="mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={handleCancel}
                          size="md"
                          variant="secondary"
                        >
                          <FontAwesomeIcon icon={faTimes} className="mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit} size="md" variant="primary">
                        <FontAwesomeIcon icon={faEdit} className="mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerSheetModal;
