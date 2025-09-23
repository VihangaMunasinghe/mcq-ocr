import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: IconDefinition;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={`${
                stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : ""
              } relative`}
            >
              {currentStep > step.id ? (
                <div className="absolute inset-0 flex items-center">
                  <div className="h-0.5 w-full bg-blue-600" />
                </div>
              ) : currentStep === step.id ? (
                <div className="absolute inset-0 flex items-center">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center">
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
              )}
              <div
                className={`relative w-8 h-8 flex items-center justify-center rounded-full ${
                  currentStep > step.id
                    ? "bg-blue-600"
                    : currentStep === step.id
                    ? "bg-blue-600 ring-2 ring-blue-600 ring-offset-2"
                    : "bg-white border-2 border-gray-300"
                }`}
              >
                {currentStep > step.id ? (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="w-4 h-4 text-white"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={step.icon}
                    className={`w-4 h-4 ${
                      currentStep === step.id ? "text-white" : "text-gray-500"
                    }`}
                  />
                )}
              </div>
              <div className="mt-3">
                <p
                  className={`text-sm font-medium ${
                    currentStep >= step.id ? "text-blue-600" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
