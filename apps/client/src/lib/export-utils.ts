/**
 * Export utilities for generating CSV, Excel, and PDF reports
 */

// Export data to CSV format
export function exportToCSV(
  data: Record<string, any>[],
  headers: { key: string; label: string }[],
  filename: string
): void {
  const headerRow = headers.map((h) => h.label).join(",");
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const value = row[h.key];
        // Escape commas and quotes in values
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      })
      .join(",")
  );

  const csv = [headerRow, ...rows].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

// Export data to Excel (XLSX) format using CSV with Excel-compatible encoding
export function exportToExcel(
  data: Record<string, any>[],
  headers: { key: string; label: string }[],
  filename: string
): void {
  const headerRow = headers.map((h) => h.label).join("\t");
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const value = row[h.key];
        return value ?? "";
      })
      .join("\t")
  );

  // Use UTF-8 BOM for Excel compatibility
  const bom = "\uFEFF";
  const tsv = bom + [headerRow, ...rows].join("\n");
  downloadFile(tsv, `${filename}.xlsx`, "application/vnd.ms-excel");
}

// Generate and download a PDF report
export async function exportToPDF(
  title: string,
  subtitle: string,
  data: Record<string, any>[],
  headers: { key: string; label: string; width?: number }[],
  filename: string
): Promise<void> {
  // Create a print-friendly HTML document
  const printContent = generatePrintHTML(title, subtitle, data, headers);

  // Open print dialog which allows saving as PDF
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Unable to open print window. Please check popup settings.");
  }

  printWindow.document.write(printContent);
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };
}

// Generate print-friendly HTML for PDF export
function generatePrintHTML(
  title: string,
  subtitle: string,
  data: Record<string, any>[],
  headers: { key: string; label: string; width?: number }[]
): string {
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tableRows = data
    .map(
      (row) =>
        `<tr>${headers
          .map((h) => `<td>${formatCellValue(row[h.key])}</td>`)
          .join("")}</tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      color: #333;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
    }
    .header h1 {
      margin: 0 0 5px 0;
      font-size: 24px;
      color: #1a1a1a;
    }
    .header .subtitle {
      font-size: 14px;
      color: #666;
    }
    .header .date {
      font-size: 12px;
      color: #888;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th {
      background-color: #2563eb;
      color: white;
      font-weight: 600;
      padding: 10px 8px;
      text-align: left;
      border: 1px solid #1d4ed8;
    }
    td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    tr:hover {
      background-color: #f3f4f6;
    }
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10px;
      color: #888;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .summary {
      margin-top: 20px;
      padding: 15px;
      background-color: #f3f4f6;
      border-radius: 8px;
    }
    .summary-item {
      display: inline-block;
      margin-right: 30px;
    }
    .summary-label {
      font-weight: 600;
      color: #666;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: #1a1a1a;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="subtitle">${subtitle}</div>
    <div class="date">Generated: ${today}</div>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total Records</div>
      <div class="summary-value">${data.length}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${h.label}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Bookie Library Management System • This report was automatically generated</p>
  </div>
</body>
</html>
  `;
}

// Format cell value for display
function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    // Check if it looks like a currency value
    if (value >= 100) return `₱${value.toLocaleString()}`;
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  return String(value);
}

// Helper to download a file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate printable circulation report
export function generateCirculationPDF(
  period: string,
  data: { period: string; checkouts: number; returns: number; renewals: number }[]
): void {
  exportToPDF(
    "Circulation Report",
    `${period.charAt(0).toUpperCase() + period.slice(1)} Statistics`,
    data,
    [
      { key: "period", label: "Period" },
      { key: "checkouts", label: "Checkouts" },
      { key: "returns", label: "Returns" },
      { key: "renewals", label: "Renewals" },
    ],
    `circulation_report_${new Date().toISOString().split("T")[0]}`
  );
}

// Generate printable overdue report
export function generateOverduePDF(
  data: {
    studentName: string;
    studentId: string;
    gradeLevel?: number;
    bookTitle: string;
    accessionNumber?: string;
    dueDate: number;
    daysOverdue: number;
    replacementCost: number;
  }[]
): void {
  const formattedData = data.map((row) => ({
    ...row,
    dueDate: new Date(row.dueDate).toLocaleDateString(),
    replacementCost: `₱${row.replacementCost.toLocaleString()}`,
  }));

  exportToPDF(
    "Overdue Books Report",
    "Books past their due date",
    formattedData,
    [
      { key: "studentName", label: "Student" },
      { key: "studentId", label: "ID" },
      { key: "gradeLevel", label: "Grade" },
      { key: "bookTitle", label: "Book Title" },
      { key: "accessionNumber", label: "Accession" },
      { key: "dueDate", label: "Due Date" },
      { key: "daysOverdue", label: "Days Overdue" },
      { key: "replacementCost", label: "Cost" },
    ],
    `overdue_report_${new Date().toISOString().split("T")[0]}`
  );
}

// Generate printable collection report
export function generateCollectionPDF(
  data: { title: string; author: string; totalBorrows: number }[]
): void {
  exportToPDF(
    "Collection Analytics Report",
    "Most Popular Books",
    data.map((book, i) => ({ rank: i + 1, ...book })),
    [
      { key: "rank", label: "Rank" },
      { key: "title", label: "Title" },
      { key: "author", label: "Author" },
      { key: "totalBorrows", label: "Total Borrows" },
    ],
    `collection_report_${new Date().toISOString().split("T")[0]}`
  );
}
