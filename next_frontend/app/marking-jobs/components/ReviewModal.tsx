import React from "react";
import { Modal } from "../../../components/UI/Modal";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { MarkingJob, ReviewQuestion } from "./types";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: MarkingJob | null;
  reviewQuestions: ReviewQuestion[];
  onReviewComplete: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  job,
  reviewQuestions,
  onReviewComplete,
}: ReviewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Required: ${job?.name}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="h-5 w-5 text-amber-400"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Manual Review Required
              </h3>
              <p className="mt-2 text-sm text-amber-700">
                The system has flagged {reviewQuestions.length} questions that
                need manual review.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {reviewQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white border border-gray-200 rounded-md p-4 shadow-sm"
            >
              <div className="flex justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  Question {question.id}
                </h4>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  Needs Review
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-700">{question.question}</p>
              <div className="mt-3 grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Options</h5>
                  <ul className="mt-1 space-y-1">
                    {question.options.map((option, i) => (
                      <li key={i} className="text-sm text-gray-600">
                        {String.fromCharCode(65 + i)}. {option}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">
                      Marked Answer
                    </h5>
                    <p className="mt-1 text-sm text-red-600">
                      {question.markedAnswer}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">
                      Suggested Answer
                    </h5>
                    <p className="mt-1 text-sm text-green-600">
                      {question.suggestedAnswer}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-gray-500">Issue</h5>
                    <p className="mt-1 text-xs text-gray-600">
                      {question.issue}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onReviewComplete}
          icon={<FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4" />}
        >
          Complete Review
        </Button>
      </div>
    </Modal>
  );
}
