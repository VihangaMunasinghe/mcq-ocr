import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faClipboardCheck,
  faFileText,
  faCheckCircle,
  faEllipsisH,
  faClock,
  faGraduationCap,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const stats = [
    {
      name: "Total Users",
      value: "2,543",
      change: "+12.5%",
      trend: "up",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      icon: <FontAwesomeIcon icon={faUsers} className="h-6 w-6" />,
    },
    {
      name: "Active Templates",
      value: "45",
      change: "+3.2%",
      trend: "up",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: <FontAwesomeIcon icon={faFileText} className="h-6 w-6" />,
    },
    {
      name: "Marking Jobs",
      value: "876",
      change: "+28.4%",
      trend: "up",
      bgColor: "bg-pink-50",
      iconColor: "text-pink-600",
      icon: <FontAwesomeIcon icon={faClipboardCheck} className="h-6 w-6" />,
    },
    {
      name: "Completion Rate",
      value: "92%",
      change: "+5.3%",
      trend: "up",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      icon: <FontAwesomeIcon icon={faCheckCircle} className="h-6 w-6" />,
    },
  ];

  const recentJobs = [
    {
      id: 1,
      name: "Math Quiz - Grade 10",
      status: "completed",
      date: "2023-04-15",
      submissions: 32,
    },
    {
      id: 2,
      name: "English Essay - Grade 11",
      status: "in-progress",
      date: "2023-04-14",
      submissions: 28,
    },
    {
      id: 3,
      name: "Science Test - Grade 9",
      status: "completed",
      date: "2023-04-12",
      submissions: 45,
    },
    {
      id: 4,
      name: "History Assignment - Grade 12",
      status: "in-progress",
      date: "2023-04-10",
      submissions: 19,
    },
    {
      id: 5,
      name: "Geography Quiz - Grade 10",
      status: "pending",
      date: "2023-04-09",
      submissions: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-6 border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {stat.name}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <div className={stat.iconColor}>{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Jobs - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Marking Jobs
              </h3>
              <button className="text-gray-400 hover:text-gray-600">
                <FontAwesomeIcon icon={faEllipsisH} className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        job.status === "completed"
                          ? "bg-green-50"
                          : job.status === "in-progress"
                          ? "bg-blue-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={
                          job.status === "completed"
                            ? faCheckCircle
                            : job.status === "in-progress"
                            ? faClock
                            : faExclamationTriangle
                        }
                        className={`h-5 w-5 ${
                          job.status === "completed"
                            ? "text-green-500"
                            : job.status === "in-progress"
                            ? "text-blue-500"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.name}</p>
                      <p className="text-sm text-gray-500">{job.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {job.submissions}
                    </p>
                    <p className="text-sm text-gray-500">submissions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Overview Card */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              System Overview
            </h3>
            <span className="text-sm text-gray-500">Live Status</span>
          </div>

          {/* System Info Display */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm opacity-80">Total Processed</p>
                <p className="text-2xl font-bold">5,756</p>
                <p className="text-sm opacity-80">Answer Sheets</p>
              </div>
              <div className="text-right">
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  className="h-8 w-8 opacity-80"
                />
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm opacity-80">SYSTEM ADMIN</p>
                <p className="font-medium">MCQ Grader Pro</p>
              </div>
              <div>
                <p className="text-sm opacity-80">VERSION</p>
                <p className="font-medium">v2.1.0</p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Processing Speed
                </span>
                <span className="text-sm font-medium text-gray-700">
                  Fast (24ms avg)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "76%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Accuracy Rate
                </span>
                <span className="text-sm font-medium text-gray-700">98.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: "98%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Storage Usage
                </span>
                <span className="text-sm font-medium text-gray-700">42%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "42%" }}
                ></div>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex items-center text-sm text-green-600">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="h-4 w-4 mr-2"
                />
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Grading Analytics */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Weekly Grading Activity
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                1,245 Papers Graded & 892 Reviews Completed this Week
              </span>
            </div>
            {/* Chart placeholder */}
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="flex space-x-2">
                {[45, 65, 40, 75, 35, 65, 50].map((height, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center space-y-1"
                  >
                    <div
                      className={`w-8 ${
                        index % 2 === 0 ? "bg-blue-500" : "bg-green-400"
                      } rounded-sm`}
                      style={{ height: `${height}px` }}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="space-y-4">
            {[
              {
                name: "Template Created",
                description: "Math Quiz - Grade 10",
                time: "2h ago",
                color: "bg-blue-50",
                iconColor: "text-blue-600",
                icon: faFileText,
              },
              {
                name: "Job Completed",
                description: "English Essay Marking",
                time: "4h ago",
                color: "bg-green-50",
                iconColor: "text-green-600",
                icon: faCheckCircle,
              },
              {
                name: "New User Registered",
                description: "Dr. Sarah Wilson",
                time: "1d ago",
                color: "bg-purple-50",
                iconColor: "text-purple-600",
                icon: faUsers,
              },
              {
                name: "System Update",
                description: "v2.1.0 deployed",
                time: "2d ago",
                color: "bg-orange-50",
                iconColor: "text-orange-600",
                icon: faGraduationCap,
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center`}
                  >
                    <FontAwesomeIcon
                      icon={activity.icon}
                      className={`h-4 w-4 ${activity.iconColor}`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.name}</p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
