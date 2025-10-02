import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faFlag,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { Table, TableColumn } from "@/components/UI/Table";
import { Button } from "@/components/UI/Button";
import { StudentResult } from "@/app/marking-jobs/types/types";

interface ResultsTableProps {
  results: StudentResult[];
  onViewMarkedPaper: (result: StudentResult) => void;
}

export function ResultsTable({
  results,
  onViewMarkedPaper,
}: ResultsTableProps) {
  const formatArrayAsString = (arr: number[]) => {
    return arr.length > 0 ? arr.join(", ") : "-";
  };

  const getFlagBadge = (flag: boolean, flagReason: string) => {
    if (!flag) return null;

    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
        title={flagReason}
      >
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className="h-3 w-3 mr-1"
        />
        Flagged
      </span>
    );
  };

  const columns: TableColumn<StudentResult>[] = [
    {
      header: "Index No",
      accessor: "index_number",
      sortable: true,
    },
    {
      header: "Correct",
      accessor: (result: StudentResult) => (
        <span className="text-green-600 font-medium">
          {result.correct}
        </span>
      ),
      sortable: false,
    },
    {
      header: "Incorrect",
      accessor: (result: StudentResult) => (
        <span className="text-red-600 font-medium">
          {result.incorrect}
        </span>
      ),
      sortable: false,
    },
    {
      header: "More than one marked",
      accessor: (result: StudentResult) => (
        <span className="text-orange-600 font-medium">
          {result.more_than_one_marked}
        </span>
      ),
      sortable: false,
    },
    {
      header: "Not marked",
      accessor: (result: StudentResult) => (
        <span className="text-yellow-600 font-medium">
          {result.not_marked}
        </span>
      ),
      sortable: false,
    },
    {
      header: "Columnwise Total",
      accessor: (result: StudentResult) => (
        <span className="text-gray-700 font-medium">
          {formatArrayAsString(result.columnwise_total)}
        </span>
      ),
      sortable: false,
    },
    {
      header: "Score",
      accessor: (result: StudentResult) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {result.score}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Flag",
      accessor: (result: StudentResult) => (
        <div className="flex flex-col space-y-1">
          {getFlagBadge(result.flag, result.flag_reason)}
          {result.flag && result.flag_reason && (
            <span
              className="text-xs text-gray-500 max-w-xs truncate"
              title={result.flag_reason}
            >
              {result.flag_reason}
            </span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      header: "Actions",
      accessor: (result: StudentResult) => (
        <Button
          variant="secondary"
          size="sm"
          icon={<FontAwesomeIcon icon={faEye} className="h-3 w-3" />}
          onClick={() => onViewMarkedPaper(result)}
          title="View marked paper"
        >
          View Paper
        </Button>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <FontAwesomeIcon
            icon={faFlag}
            className="h-5 w-5 mr-2 text-gray-500"
          />
          Student Results
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {results.length} students
          </span>
        </h3>
      </div>
      <Table
        columns={columns}
        data={results}
        keyField="row_number"
        pagination={true}
        itemsPerPage={10}
        searchable={true}
        searchPlaceholder="Search by index number..."
        emptyMessage="No results found"
      />
    </div>
  );
}
