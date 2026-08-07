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
    startMs?: number | null;
    cards: CyberboardCard[];
  }

  const sections: GroupedExportSection[] = [];

  // Group by Phase if board is a roadmap or any card has phase assigned or board has phase_settings
  const configuredPhases = (board.phase_settings && board.phase_settings.length > 0)
    ? board.phase_settings
    : [
        { name: "Requirements & Planning" },
        { name: "Architecture & Design" },
        { name: "Development & Implementation" },
        { name: "Testing & QA" },
        { name: "Deployment & Release" },
      ];

  const phaseMap = new Map<string, { id: string; title: string; cards: CyberboardCard[] }>();

  configuredPhases.forEach((ps, idx) => {
    phaseMap.set(ps.name.toLowerCase(), {
      id: `phase-${idx}`,
      title: ps.name,
      cards: [],
    });
  });

  phaseMap.set("unassigned", {
    id: "phase-unassigned",
    title: "General / Unassigned Phase",
    cards: [],
  });

  allCards.forEach((c) => {
    if (c.phase) {
      const key = c.phase.toLowerCase();
      if (!phaseMap.has(key)) {
        phaseMap.set(key, {
          id: `phase-custom-${key}`,
          title: c.phase,
          cards: [],
        });
      }
      phaseMap.get(key)?.cards.push(c);
    } else {
      phaseMap.get("unassigned")?.cards.push(c);
    }
  });

  // Convert phaseMap entries into sections (include configured phases or non-empty unassigned/custom phases)
  Array.from(phaseMap.values()).forEach((group) => {
    if (group.cards.length > 0 || (group.id !== "phase-unassigned" && board.type === "roadmap")) {
      const phaseCards = group.cards;
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
          card.assigned_users.forEach((u) => {
            const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.name || u.username;
            if (name) assigneesSet.add(name);
          });
        } else if ((card as any).assignee) {
          assigneesSet.add((card as any).assignee.name || (card as any).assignee.username);
        }
      });

      // Sort phase items chronologically from oldest start date to newest start date (e.g., August 1 to August 31)
      const sortedPhaseCards = [...phaseCards].sort((a, b) => {
        const startA = a.activity_date ? new Date(a.activity_date).getTime() : Infinity;
        const startB = b.activity_date ? new Date(b.activity_date).getTime() : Infinity;

        if (startA !== startB) {
          return startA - startB; // Ascending: earliest start date first
        }

        const endA = a.activity_end_date ? new Date(a.activity_end_date).getTime() : Infinity;
        const endB = b.activity_end_date ? new Date(b.activity_end_date).getTime() : Infinity;
        return endA - endB;
      });

      const pStartStr = pStartMs ? new Date(pStartMs).toISOString() : "";
      const pEndStr = pEndMs ? new Date(pEndMs).toISOString() : "";
      const pDuration = calculateDurationDays(pStartStr, pEndStr);

      const allDone = sortedPhaseCards.length > 0 && sortedPhaseCards.every((c) => {
        const matchingCol = columns.find((col) => col.id === c.column_id);
        const cCol = matchingCol?.title || "";
        return matchingCol?.status_type === "completed" ||
          cCol.toLowerCase().includes("done") ||
          cCol.toLowerCase().includes("complete") ||
          (c as any).is_completed;
      });

      sections.push({
        id: group.id,
        title: group.title.toUpperCase(),
        responsible: Array.from(assigneesSet).join(", ") || "",
        startDate: formatDateShort(pStartStr),
        endDate: formatDateShort(pEndStr),
        duration: pDuration,
        status: sortedPhaseCards.length === 0 ? "Not Started" : allDone ? "Complete" : "In Progress",
        startMs: pStartMs,
        cards: sortedPhaseCards,
      });
    }
  });

  // Fallback: If no phases were found/populated and not a roadmap board, group by Column
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
            card.assigned_users.forEach((u) => {
              const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.name || u.username;
              if (name) assigneesSet.add(name);
            });
          } else if ((card as any).assignee) {
            assigneesSet.add((card as any).assignee.name || (card as any).assignee.username);
          }
        });

        // Sort column cards chronologically from oldest time to newest time
        const sortedColCards = [...colCards].sort((a, b) => {
          const startA = a.activity_date ? new Date(a.activity_date).getTime() : Infinity;
          const startB = b.activity_date ? new Date(b.activity_date).getTime() : Infinity;

          if (startA !== startB) {
            return startA - startB;
          }

          const endA = a.activity_end_date ? new Date(a.activity_end_date).getTime() : Infinity;
          const endB = b.activity_end_date ? new Date(b.activity_end_date).getTime() : Infinity;
          return endA - endB;
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
          startMs: pStartMs,
          cards: sortedColCards,
        });
      }
    });
  }

  // Sort sections chronologically by their earliest start date (dated sections come first, from oldest to newest)
  sections.sort((a, b) => {
    const startA = a.startMs !== undefined && a.startMs !== null ? a.startMs : Infinity;
    const startB = b.startMs !== undefined && b.startMs !== null ? b.startMs : Infinity;
    return startA - startB;
  });

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
