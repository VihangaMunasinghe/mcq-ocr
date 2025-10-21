"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faClipboardCheck,
  faFileText,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faSpinner,
  faChartBar,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import { DashboardStats } from "@/models/dashboard";


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

// Custom hook for intersection observer
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    }, { threshold: 0.1, ...options });

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, []);

  return [elementRef, isVisible] as const;
};

// Animated progress bar component
const AnimatedProgressBar = ({ percentage, color, delay = 0 }: { percentage: number; color: string; delay?: number }) => {
  const [width, setWidth] = useState(0);
  const [ref, isVisible] = useIntersectionObserver();

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setWidth(percentage);
      }, delay);
    }
  }, [isVisible, percentage, delay]);

  return (
    <div ref={ref} className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${width}%` }}
      ></div>
    </div>
  );
};

// Animated config comparison bar component
const ConfigComparisonBar = ({ completedJobs, failedJobs, delay = 0 }: { completedJobs: number; failedJobs: number; delay?: number }) => {
  const [completedWidth, setCompletedWidth] = useState(0);
  const [failedWidth, setFailedWidth] = useState(0);
  const [ref, isVisible] = useIntersectionObserver();

  const totalJobs = completedJobs + failedJobs;
  const completedPercentage = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const failedPercentage = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setCompletedWidth(completedPercentage);
        setFailedWidth(failedPercentage);
      }, delay);
    }
  }, [isVisible, completedPercentage, failedPercentage, delay]);

  return (
    <div ref={ref} className="mt-3">
      <div className="flex text-xs mb-1">
        <span className="text-green-600">Completed: {completedJobs}</span>
        <span className="text-red-600 ml-auto">Failed: {failedJobs}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 flex overflow-hidden">
        {totalJobs > 0 && (
          <>
            <div
              className="bg-green-500 h-2 transition-all duration-1000 ease-out"
              style={{ width: `${completedWidth}%` }}
            ></div>
            <div
              className="bg-red-500 h-2 transition-all duration-1000 ease-out"
              style={{ width: `${failedWidth}%` }}
            ></div>
          </>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Trigger welcome animation after data loads
    if (dashboardData) {
      setTimeout(() => setWelcomeVisible(true), 100);
    }
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Fetching from:", `${BACKEND_URL}/api/dashboard/stats?user_id=1`);
      
      const response = await fetch(`${BACKEND_URL}/api/dashboard/stats?user_id=1`);
      
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (!response.ok) {
        // Get detailed error message from backend
        const errorText = await response.text();
        console.error("Backend error response:", errorText);
        throw new Error(`Failed to fetch dashboard data (Status: ${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Dashboard data received:", data);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return { bg: "bg-green-50", icon: "text-green-500", badge: "bg-green-100 text-green-800" };
      case "processing":
        return { bg: "bg-blue-50", icon: "text-blue-500", badge: "bg-blue-100 text-blue-800" };
      case "failed":
        return { bg: "bg-red-50", icon: "text-red-500", badge: "bg-red-100 text-red-800" };
      case "queued":
        return { bg: "bg-yellow-50", icon: "text-yellow-500", badge: "bg-yellow-100 text-yellow-800" };
      default:
        return { bg: "bg-gray-50", icon: "text-gray-500", badge: "bg-gray-100 text-gray-800" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return faCheckCircle;
      case "processing":
        return faSpinner;
      case "failed":
        return faExclamationTriangle;
      case "queued":
        return faClock;
      default:
        return faClock;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds.toFixed(2)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`;
    return `${(seconds / 3600).toFixed(2)}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="h-12 w-12 text-red-600" />
          <p className="mt-4 text-gray-600">Error loading dashboard: {error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Users",
      value: dashboardData.key_stats.total_users.toString(),
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      icon: <FontAwesomeIcon icon={faUsers} className="h-6 w-6" />,
    },
    {
      name: "Active Templates",
      value: dashboardData.key_stats.active_templates.toString(),
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: <FontAwesomeIcon icon={faFileText} className="h-6 w-6" />,
    },
    {
      name: "Completed Jobs",
      value: dashboardData.key_stats.completed_marking_jobs.toString(),
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
      icon: <FontAwesomeIcon icon={faClipboardCheck} className="h-6 w-6" />,
    },
    {
      name: "Completion Rate",
      value: `${dashboardData.key_stats.completion_rate.toFixed(1)}%`,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      icon: <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section with Animation */}
      <div 
        className={`bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white transform transition-all duration-700 ${
          welcomeVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <h1 className="text-2xl font-bold">Welcome, {dashboardData.user_name}! 👋</h1>
        <p className="mt-2 opacity-90">Here's what's happening with your MCQ marking system today.</p>
      </div>

      {/* Stats Cards with staggered animation */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`bg-white rounded-lg p-6 border border-gray-100 hover:shadow-lg transition-all duration-500 transform ${
              welcomeVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
            style={{ transitionDelay: `${(index + 1) * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor} transform transition-transform hover:scale-110`}>
                <div className={stat.iconColor}>{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Marking Jobs - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Marking Jobs</h3>
            </div>
            <div className="space-y-4">
              {dashboardData.recent_marking_jobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No marking jobs yet</p>
              ) : (
                dashboardData.recent_marking_jobs.map((job, index) => {
                  const statusColor = getStatusColor(job.status);
                  return (
                    <div
                      key={job.id}
                      onClick={() => router.push('/marking-jobs')}
                      className="p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 cursor-pointer hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColor.bg}`}>
                            <FontAwesomeIcon
                              icon={getStatusIcon(job.status)}
                              className={`h-5 w-5 ${statusColor.icon} ${job.status === "processing" ? "animate-spin" : ""}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{job.name}</p>
                            <p className="text-sm text-gray-500">Template: {job.template_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColor.badge}`}>
                            {job.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(job.created_at)}</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar with Animation */}
                      {job.total_answer_sheets && job.total_answer_sheets > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">
                              Progress: {job.processed_answer_sheets || 0} / {job.total_answer_sheets}
                            </span>
                            <span className="text-gray-600">{job.progress_percentage.toFixed(0)}%</span>
                          </div>
                          <AnimatedProgressBar 
                            percentage={job.progress_percentage}
                            color={
                              job.status === "completed" ? "bg-green-500" :
                              job.status === "failed" ? "bg-red-500" :
                              "bg-blue-500"
                            }
                            delay={index * 100}
                          />
                          {job.failed_answer_sheets && job.failed_answer_sheets > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              {job.failed_answer_sheets} failed
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Templates */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Templates</h3>
          </div>
          <div className="space-y-4">
            {dashboardData.recent_templates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No templates yet</p>
            ) : (
              dashboardData.recent_templates.map((template, index) => (
                <div 
                  key={template.id}
                  onClick={() => router.push('/templates')}
                  className={`p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all duration-500 hover:shadow-md transform cursor-pointer ${
                    welcomeVisible ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                  }`}
                  style={{ transitionDelay: `${(index + 2) * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {template.num_questions} questions
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.config_type === "grid_based" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {template.config_type.replace("_", " ")}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          template.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {template.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(template.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Config Type Comparison & User Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Config Type Comparison */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              <FontAwesomeIcon icon={faChartBar} className="mr-2" />
              Config Type Comparison
            </h3>
          </div>
          <div className="space-y-6">
            {dashboardData.config_type_comparison.map((config, index) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-semibold ${
                    config.config_type === "grid_based" ? "text-purple-600" : "text-orange-600"
                  }`}>
                    {config.config_type.replace("_", " ").toUpperCase()}
                  </h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Templates</p>
                    <p className="font-semibold text-gray-900">{config.template_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Jobs</p>
                    <p className="font-semibold text-gray-900">{config.marking_job_count}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Completion Rate</p>
                    <p className="font-semibold text-green-600">{config.completion_rate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Time Per Answer Sheet</p>
                    <p className="font-semibold text-gray-900">
                      {formatTime(config.avg_completion_time_seconds)}
                    </p>
                  </div>
                </div>
                
                {/* Visual bar for completed vs failed with Animation */}
                <ConfigComparisonBar 
                  completedJobs={config.completed_jobs}
                  failedJobs={config.failed_jobs}
                  delay={index * 200}
                />
              </div>
            ))}
          </div>
        </div>

        {/* User Activities */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              Your Recent Activities
            </h3>
          </div>
          <div className="space-y-4">
            {dashboardData.user_activities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activities</p>
            ) : (
              dashboardData.user_activities.map((activity, index) => {
                const activityConfig = {
                  template_created: { color: "bg-blue-50", iconColor: "text-blue-600", icon: faFileText },
                  marking_job_created: { color: "bg-purple-50", iconColor: "text-purple-600", icon: faClipboardCheck },
                  marking_job_completed: { color: "bg-green-50", iconColor: "text-green-600", icon: faCheckCircle },
                };
                const config = activityConfig[activity.activity_type as keyof typeof activityConfig] || 
                  { color: "bg-gray-50", iconColor: "text-gray-600", icon: faClock };

                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between transition-all duration-500 p-2 rounded-lg hover:bg-gray-50 transform ${
                      welcomeVisible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center transition-transform hover:scale-110`}>
                        <FontAwesomeIcon icon={config.icon} className={`h-4 w-4 ${config.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">ID: {activity.related_id}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
