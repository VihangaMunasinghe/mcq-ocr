import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faInfoCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FontAwesomeIcon icon={faCheckCircle} className="h-5 w-5 text-green-400" />;
      case "error":
        return <FontAwesomeIcon icon={faTimesCircle} className="h-5 w-5 text-red-400" />;
      case "warning":
        return <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-amber-400" />;
      case "info":
        return <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = () => {
    const baseStyles =
      "max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 overflow-hidden";
    switch (type) {
      case "success":
        return `${baseStyles} ring-green-500/30`;
      case "error":
        return `${baseStyles} ring-red-500/30`;
      case "warning":
        return `${baseStyles} ring-amber-500/30`;
      case "info":
        return `${baseStyles} ring-blue-500/30`;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "warning":
        return "bg-amber-50";
      case "info":
        return "bg-blue-50";
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className={getStyles()}>
        <div className="p-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${getBgColor()} p-1 rounded-full`}>
              {getIcon()}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
              >
                <span className="sr-only">Close</span>
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
