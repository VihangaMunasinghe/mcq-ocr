import React from "react";
import Image from "next/image";
import { Bubble } from "@/app/marking-jobs/types/types";
import AnswerSheetBubble from "./AnswerSheetBubble";
import { BubbleStyle } from "./AnswerSheetBubble";

const _getBubbleStyle = (
  questionIndex: number,
  optionIndex: number,
  answers: Bubble[][],
  markingScheme: Bubble[][],
  isMarkingScheme: boolean,
  isEditing: boolean
): BubbleStyle => {
  if (isMarkingScheme) {
    // Marking scheme mode - always green with tick
    return {
      color: "green",
      icon: (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  }

  const studentAnswer = answers[questionIndex]?.[optionIndex];
  const correctAnswer = markingScheme[questionIndex]?.[optionIndex];

  if (!studentAnswer) {
    return { color: "gray", icon: null };
  }

  // Count marked answers for this question
  const markedCount =
    answers[questionIndex]?.filter((bubble) => bubble.marked).length || 0;

  if (markedCount > 1) {
    // Multiple answers marked - amber with warning icon
    return {
      color: "amber",
      icon: (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  }

  if (studentAnswer.marked && correctAnswer?.marked) {
    // Correct answer - green with tick
    return {
      color: "green",
      icon: (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  }

  if (studentAnswer.marked && !correctAnswer?.marked) {
    // Wrong answer - red with X icon
    return {
      color: "red",
      icon: (
        <svg
          className="w-4 h-4 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ),
    };
  }

  // Not marked or correct but not selected - blue
  return { color: isEditing ? "green" : "transparent", icon: null };
};

interface AnswerSheetViewerProps {
  imageUrl: string;
  bubbleData: Bubble[][];
  onBubbleToggle?: (questionIndex: number, optionIndex: number) => void;
  showBubbles?: boolean;
  isInteractive?: boolean;
  width?: number;
  height?: number;
  className?: string;
  isMarkingScheme: boolean;
  markingScheme?: Bubble[][];
}

export const AnswerSheetViewer = ({
  imageUrl,
  bubbleData,
  onBubbleToggle,
  showBubbles = true,
  isInteractive = true,
  width = 1200,
  height = 1600,
  className = "",
  isMarkingScheme = true,
  markingScheme = [],
}: AnswerSheetViewerProps) => {
  const handleBubbleClick = (questionIndex: number, optionIndex: number) => {
    if (isInteractive && onBubbleToggle) {
      onBubbleToggle(questionIndex, optionIndex);
    }
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="relative bg-gray-100 border border-gray-200 rounded-lg overflow-hidden"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Background Image */}
        <Image
          src={imageUrl}
          alt="Answer sheet"
          width={width}
          height={height}
          className="w-full h-full"
          draggable={false}
          unoptimized
          priority
        />

        {/* Positioned Bubbles */}
        {showBubbles &&
          bubbleData.map((question, questionIndex) =>
            question.map((bubble, optionIndex) => {
              const bubbleStyle = _getBubbleStyle(
                questionIndex,
                optionIndex,
                bubbleData,
                markingScheme,
                isMarkingScheme,
                isInteractive
              );
              return (
                <AnswerSheetBubble
                  key={`${questionIndex}-${optionIndex}`}
                  bubble={bubble}
                  bubbleStyle={bubbleStyle}
                  questionIndex={questionIndex}
                  optionIndex={optionIndex}
                  isInteractive={isInteractive}
                  handleBubbleClick={handleBubbleClick}
                />
              );
            })
          )}
      </div>
    </div>
  );
};
