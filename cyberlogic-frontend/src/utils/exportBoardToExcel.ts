import type { CyberboardBoard, CyberboardColumn, CyberboardCard } from "./api";

/**
 * Utility to export CyberBoard / Gantt Roadmap data into a professionally styled Excel spreadsheet (.xls / .xlsx)
 * matching the user's tabular layout template.
 */
export function exportBoardToExcel(
  board: CyberboardBoard,
  columns: CyberboardColumn[],
  cards: CyberboardCard[]
) {
  const allCards = cards.length > 0 ? cards : (columns || []).flatMap((col) => col.cards || []);

  // 1. Calculate overall board date bounds & progress
  let earliestStartMs: number | null = null;
  let latestEndMs: number | null = null;
  let completedCount = 0;

  allCards.forEach((card) => {
    if (card.activity_date) {
      const startMs = new Date(card.activity_date).getTime();
      if (!isNaN(startMs)) {
        if (earliestStartMs === null || startMs < earliestStartMs) earliestStartMs = startMs;
      }
    }
    if (card.activity_end_date) {
      const endMs = new Date(card.activity_end_date).getTime();
      if (!isNaN(endMs)) {
        if (latestEndMs === null || endMs > latestEndMs) latestEndMs = endMs;
      }
    }

    // Check if card is in a completed stage (via column.status_type or title fallback)
    const matchingCol = columns.find((c) => c.id === card.column_id);
    const colName = (card as any).column_title || matchingCol?.title || "";
    const isCompletedType = matchingCol?.status_type === "completed" ||
      colName.toLowerCase().includes("done") ||
      colName.toLowerCase().includes("complete") ||
      colName.toLowerCase().includes("finish") ||
      (card as any).is_completed;

    if (isCompletedType) {
      completedCount++;
    }
  });

  const overallProgressPct = allCards.length > 0 ? Math.round((completedCount / allCards.length) * 100) : 0;

  const formatDateShort = (dateStr?: string | null): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${m}/${day}`;
  };

  const calculateDurationDays = (startStr?: string | null, endStr?: string | null): string => {
    if (!startStr || !endStr) return "";
    const startMs = new Date(startStr).getTime();
    const endMs = new Date(endStr).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) return "";
    const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    return String(diffDays);
  };

  const getStatusBgColor = (statusName: string, statusType?: string | null): { bg: string; text: string } => {
    if (statusType === "completed") return { bg: "#16a34a", text: "#ffffff" }; // Crisp Green
    if (statusType === "in_progress") return { bg: "#65a30d", text: "#ffffff" }; // Lime Green
    if (statusType === "under_review") return { bg: "#06b6d4", text: "#ffffff" }; // Cyan
    if (statusType === "blocked") return { bg: "#ea580c", text: "#ffffff" }; // Amber/Orange
    if (statusType === "not_started") return { bg: "#fef08a", text: "#1e293b" }; // Light Yellow

    const s = statusName.toLowerCase();
    if (s.includes("done") || s.includes("complete")) {
      return { bg: "#16a34a", text: "#ffffff" };
    }
    if (s.includes("progress") || s.includes("review") || s.includes("testing")) {
      return { bg: "#65a30d", text: "#ffffff" };
    }
    if (s.includes("overdue") || s.includes("blocked") || s.includes("stuck")) {
      return { bg: "#ea580c", text: "#ffffff" };
    }
    if (s.includes("hold") || s.includes("pending")) {
      return { bg: "#94a3b8", text: "#ffffff" };
    }
    return { bg: "#fef08a", text: "#1e293b" };
  };

  // 2. Group cards by Phase or Column
  interface GroupedExportSection {
    id: string;
    title: string;
    responsible: string;
    startDate: string;
    endDate: string;
    duration: string;
    status: string;
    cards: CyberboardCard[];
  }

  const sections: GroupedExportSection[] = [];

  if (board.type === "roadmap") {
    const phases = [
      { id: "phase-1", title: "SPRINT 1" },
      { id: "phase-2", title: "SPRINT 2" },
      { id: "phase-3", title: "SPRINT 3" },
      { id: "phase-4", title: "SPRINT 4" },
      { id: "phase-5", title: "SPRINT 5" },
    ];

    phases.forEach((phase) => {
      const phaseCards = allCards.filter(
        (c) => ((c as any).sdlc_phase || "phase-1") === phase.id
      );

      if (phaseCards.length > 0) {
        let pStartMs: number | null = null;
        let pEndMs: number | null = null;
        const assigneesSet = new Set<string>();

        phaseCards.forEach((card) => {
          if (card.activity_date) {
            const ms = new Date(card.activity_date).getTime();
            if (!isNaN(ms) && (pStartMs === null || ms < pStartMs)) pStartMs = ms;
          }
          if (card.activity_end_date) {
            const ms = new Date(card.activity_end_date).getTime();
            if (!isNaN(ms) && (pEndMs === null || ms > pEndMs)) pEndMs = ms;
          }
          if (card.assigned_users && card.assigned_users.length > 0) {
            card.assigned_users.forEach((u) => assigneesSet.add(u.name));
          } else if ((card as any).assignee) {
            assigneesSet.add((card as any).assignee.name);
          }
        });

        const pStartStr = pStartMs ? new Date(pStartMs).toISOString() : "";
        const pEndStr = pEndMs ? new Date(pEndMs).toISOString() : "";
        const pDuration = calculateDurationDays(pStartStr, pEndStr);

        // Check if all completed
        const allDone = phaseCards.every((c) => {
          const cCol = columns.find((col) => col.id === c.column_id)?.title || "";
          return cCol.toLowerCase().includes("done") || cCol.toLowerCase().includes("complete");
        });

        sections.push({
          id: phase.id,
          title: phase.title,
          responsible: Array.from(assigneesSet).join(", ") || "",
          startDate: formatDateShort(pStartStr),
          endDate: formatDateShort(pEndStr),
          duration: pDuration,
          status: allDone ? "Complete" : "In Progress",
          cards: phaseCards,
        });
      }
    });
  }

  // Fallback: If no phases found or normal board, group by Column
  if (sections.length === 0) {
    (columns || []).forEach((col) => {
      const colCards = col.cards || allCards.filter((c) => c.column_id === col.id);
      if (colCards.length > 0) {
        let pStartMs: number | null = null;
        let pEndMs: number | null = null;
        const assigneesSet = new Set<string>();

        colCards.forEach((card) => {
          if (card.activity_date) {
            const ms = new Date(card.activity_date).getTime();
            if (!isNaN(ms) && (pStartMs === null || ms < pStartMs)) pStartMs = ms;
          }
          if (card.activity_end_date) {
            const ms = new Date(card.activity_end_date).getTime();
            if (!isNaN(ms) && (pEndMs === null || ms > pEndMs)) pEndMs = ms;
          }
          if (card.assigned_users && card.assigned_users.length > 0) {
            card.assigned_users.forEach((u) => assigneesSet.add(u.name));
          } else if ((card as any).assignee) {
            assigneesSet.add((card as any).assignee.name);
          }
        });

        const pStartStr = pStartMs ? new Date(pStartMs).toISOString() : "";
        const pEndStr = pEndMs ? new Date(pEndMs).toISOString() : "";

        sections.push({
          id: String(col.id),
          title: col.title.toUpperCase(),
          responsible: Array.from(assigneesSet).join(", ") || "",
          startDate: formatDateShort(pStartStr),
          endDate: formatDateShort(pEndStr),
          duration: calculateDurationDays(pStartStr, pEndStr),
          status: col.title,
          cards: colCards,
        });
      }
    });
  }

  const overallStartStr = earliestStartMs ? new Date(earliestStartMs).toISOString() : "";
  const overallEndStr = latestEndMs ? new Date(latestEndMs).toISOString() : "";

  // 3. Build HTML Spreadsheet XML Document with rich cell styling, colors & custom column widths
  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>${escapeXml(board.title || "Roadmap")}</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; }
    th, td { border: 1px solid #94a3b8; padding: 6px 10px; vertical-align: middle; }
    .header-label { background-color: #f1f5f9; font-weight: bold; color: #1e293b; text-align: right; }
    .header-val { background-color: #ffffff; font-weight: bold; color: #0f172a; text-align: center; }
    .table-head { background-color: #475569; color: #ffffff; font-weight: bold; text-align: center; text-transform: uppercase; }
    .section-row { background-color: #94a3b8; color: #0f172a; font-weight: bold; text-transform: uppercase; }
    .task-row { background-color: #ffffff; color: #334155; }
    .text-center { text-align: center; }
    .text-bold { font-weight: bold; }
    .status-cell { font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <!-- Top Metadata Block -->
  <table>
    <col style="width: 140px;" />
    <col style="width: 220px;" />
    <col style="width: 150px;" />
    <col style="width: 100px;" />
    <col style="width: 90px;" />
    <col style="width: 90px;" />
    <col style="width: 110px;" />
    <col style="width: 130px;" />
    <col style="width: 200px;" />

    <tr>
      <td class="header-label">PROJECT NAME</td>
      <td class="header-val" style="text-align: left;">${escapeXml(board.title)}</td>
      <td class="header-label">START DATE</td>
      <td class="header-val">${formatDateShort(overallStartStr)}</td>
      <td class="header-label">OVERALL PROGRESS</td>
      <td class="header-val">${overallProgressPct}%</td>
      <td class="header-label" style="text-align: center;">PROJECT DELIVERABLE</td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td class="header-label">PROJECT MANAGER</td>
      <td class="header-val"></td>
      <td class="header-label">END DATE</td>
      <td class="header-val">${formatDateShort(overallEndStr)}</td>
      <td colspan="2"></td>
      <td class="header-label" style="text-align: center;">SCOPE STATEMENT</td>
      <td colspan="2"></td>
    </tr>
  </table>

  <br/>

  <!-- Main Data Table -->
  <table>
    <col style="width: 220px;" />
    <col style="width: 130px;" />
    <col style="width: 160px;" />
    <col style="width: 100px;" />
    <col style="width: 90px;" />
    <col style="width: 90px;" />
    <col style="width: 110px;" />
    <col style="width: 130px;" />
    <col style="width: 220px;" />

    <thead>
      <tr>
        <th class="table-head" style="width: 220px;">TASK NAME</th>
        <th class="table-head" style="width: 130px;">FEATURE TYPE</th>
        <th class="table-head" style="width: 160px;">RESPONSIBLE</th>
        <th class="table-head" style="width: 100px;">STORY POINTS</th>
        <th class="table-head" style="width: 90px;">START</th>
        <th class="table-head" style="width: 90px;">FINISH</th>
        <th class="table-head" style="width: 110px;">DURATION in days</th>
        <th class="table-head" style="width: 130px;">STATUS</th>
        <th class="table-head" style="width: 220px;">COMMENTS</th>
      </tr>
    </thead>
    <tbody>
      ${sections
        .map((sec) => {
          const secStatusStyle = getStatusBgColor(sec.status);
          const secRowHtml = `
            <tr class="section-row">
              <td class="text-bold" style="background-color: #94a3b8; color: #0f172a;">${escapeXml(sec.title)}</td>
              <td style="background-color: #cbd5e1;"></td>
              <td style="background-color: #cbd5e1;" class="text-bold">${escapeXml(sec.responsible)}</td>
              <td style="background-color: #cbd5e1;"></td>
              <td style="background-color: #cbd5e1;" class="text-center text-bold">${sec.startDate}</td>
              <td style="background-color: #cbd5e1;" class="text-center text-bold">${sec.endDate}</td>
              <td style="background-color: #cbd5e1;" class="text-center text-bold">${sec.duration}</td>
              <td class="status-cell" style="background-color: ${secStatusStyle.bg}; color: ${secStatusStyle.text};">${escapeXml(sec.status)}</td>
              <td style="background-color: #cbd5e1;"></td>
            </tr>
          `;

          const taskRowsHtml = sec.cards
            .map((card) => {
              const matchingCol = columns.find((c) => c.id === card.column_id);
              const colName =
                (card as any).column_title ||
                matchingCol?.title ||
                "Not Started";

              const responsibleNames =
                card.assigned_users && card.assigned_users.length > 0
                  ? card.assigned_users.map((u) => u.name).join(", ")
                  : (card as any).assignee?.name || "";

              const startDate = formatDateShort(card.activity_date);
              const endDate = formatDateShort(card.activity_end_date);
              const duration = calculateDurationDays(card.activity_date, card.activity_end_date);
              const statusStyle = getStatusBgColor(colName, matchingCol?.status_type);

              return `
                <tr class="task-row">
                  <td style="padding-left: 20px;">${escapeXml(card.title)}</td>
                  <td></td>
                  <td>${escapeXml(responsibleNames)}</td>
                  <td></td>
                  <td class="text-center">${startDate}</td>
                  <td class="text-center">${endDate}</td>
                  <td class="text-center">${duration}</td>
                  <td class="status-cell" style="background-color: ${statusStyle.bg}; color: ${statusStyle.text};">${escapeXml(colName)}</td>
                  <td></td>
                </tr>
              `;
            })
            .join("");

          return secRowHtml + taskRowsHtml;
        })
        .join("")}
    </tbody>
  </table>
</body>
</html>
  `;

  // Trigger browser file download
  const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `${(board.title || "CyberBoard").replace(/[^a-z0-9]/gi, "_")}_Export.xls`;

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
