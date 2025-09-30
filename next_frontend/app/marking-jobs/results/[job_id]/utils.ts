import * as XLSX from "xlsx";
import { StudentResult } from "../types";

export const _convertBlobToStudentResults = async (
  blob: Blob
): Promise<StudentResult[]> => {
  try {
    // 1. Convert blob to array buffer and load workbook
    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });

    // 2. Get the first worksheet
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet) {
      throw new Error("No worksheet found");
    }

    // 3. Convert rows to StudentResult format
    const results: StudentResult[] = [];

    // Convert worksheet to JSON array, skipping header row
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | boolean | undefined)[][];
    rows.forEach((row, rowNumber) => {
      if (rowNumber === 0) return; // Skip header (first row)
      if (row && row[1]) {
        // Check if row has data (ExcelJS uses 1-based indexing)
        const parseNumberArray = (str: string): number[] => {
          if (!str || str === "-") return [];
          return str
            .split(",")
            .map((s) => parseInt(s.trim()))
            .filter((n) => !isNaN(n));
        };

        try {
          const labeledPoints = row[10] ? JSON.parse(String(row[10])) : {};

          results.push({
            row_number: rowNumber,
            index_number: String(row[0] || ""),
            correct: String(row[1] || "").split(",").filter(s => s.trim() !== "" && s.trim() !== "-").length,
            incorrect: String(row[2] || "").split(",").filter(s => s.trim() !== "" && s.trim() !== "-").length,
            more_than_one_marked: String(row[3] || "").split(",").filter(s => s.trim() !== "" && s.trim() !== "-").length,
            not_marked: String(row[4] || "").split(",").filter(s => s.trim() !== "" && s.trim() !== "-").length,
            columnwise_total: parseNumberArray(String(row[5] || "")),
            score: Number(row[6]) || 0,
            flag: Boolean(row[7] || false),
            flag_reason: String(row[8] || ""),
            answer_sheet_path: String(row[9] || ""),
            labeled_points: labeledPoints,
          });
        } catch (parseError) {
          console.warn(`Error parsing row ${rowNumber}:`, parseError);
        }
      }
    });

    return results;
  } catch (error) {
    console.error("Error converting blob to student results:", error);
    throw error;
  }
};
