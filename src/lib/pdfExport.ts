import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type Question } from "@/data/mockData";

export interface PDFExportData {
  companies: { id: string; name: string; sector: string; employees: number; color: string }[];
  sections: { id: string; name: string; shortName: string }[];
  questions: Question[];
  respondents: { id: string; companyId: string; name: string; sex: string; age: number; sector: string; answers: Record<string, number> }[];
  getCompanyRespondents: (companyId: string) => any[];
  getSectionAverage: (sectionId: string, companyId?: string) => number;
  getQuestionAverage: (questionId: string, companyId?: string) => number;
  getAnswerDistribution: (questionId: string, companyId?: string) => { value: number; count: number; percentage: number }[];
  getAvailableSections: () => { id: string; name: string; shortName: string }[];
  getAvailableQuestions: () => Question[];
}

const COLORS = {
  primary: [15, 30, 61] as [number, number, number],
  accent: [59, 130, 246] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  text: [30, 30, 30] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function addHeader(doc: jsPDF, companyName: string, subtitle: string) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, doc.internal.pageSize.width, 38, "F");

  doc.setFillColor(...COLORS.accent);
  doc.circle(22, 19, 10, "F");
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("P", 19.5, 22);

  doc.setFontSize(18);
  doc.text("PROATIVA", 38, 17);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Protocolo de Avaliação dos Riscos Psicossociais do Trabalho", 38, 24);

  doc.setFontSize(8);
  const maxW = doc.internal.pageSize.width - 80;
  const nameText = `${companyName} — ${subtitle}`;
  doc.text(nameText.length > 80 ? nameText.slice(0, 80) + "…" : nameText, 38, 31);

  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, doc.internal.pageSize.width - 55, 31);
}

function addFooter(doc: jsPDF, pageNum: number) {
  const h = doc.internal.pageSize.height;
  const w = doc.internal.pageSize.width;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, h - 15, w - 15, h - 15);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text("PROATIVA Dashboard — Relatório Confidencial", 15, h - 10);
  doc.text(`Página ${pageNum}`, w - 30, h - 10);
}

function getClassification(value: number): { label: string; color: [number, number, number] } {
  if (value >= 4) return { label: "Bom", color: COLORS.success };
  if (value >= 3) return { label: "Moderado", color: COLORS.warning };
  return { label: "Crítico", color: COLORS.danger };
}

export function exportCompanyPDF(companyId: string, data: PDFExportData) {
  const company = data.companies.find(c => c.id === companyId);
  if (!company) return;

  const doc = new jsPDF();
  const pool = data.getCompanyRespondents(companyId);
  const availableSections = data.getAvailableSections();
  const availableQuestions = data.getAvailableQuestions();
  const overallAvg = availableSections.length > 0
    ? availableSections.reduce((acc, s) => acc + data.getSectionAverage(s.id, companyId), 0) / availableSections.length
    : 0;
  let page = 1;

  // Page 1: Cover + Summary
  addHeader(doc, company.name, "Relatório Individual");

  const kpis = [
    { label: "Respostas", value: pool.length.toString() },
    { label: "Média Geral", value: overallAvg.toFixed(2) },
    { label: "Setor", value: company.sector },
    { label: "Funcionários", value: company.employees.toString() },
  ];

  let kpiX = 15;
  kpis.forEach(kpi => {
    doc.setFillColor(...COLORS.bg);
    doc.roundedRect(kpiX, 45, 43, 25, 3, 3, "F");
    doc.setTextColor(...COLORS.primary);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, kpiX + 21.5, 58, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(kpi.label, kpiX + 21.5, 65, { align: "center" });
    kpiX += 46;
  });

  // Section summary table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Resumo por Pilar", 15, 82);

  const sectionRows = availableSections.map(s => {
    const avg = data.getSectionAverage(s.id, companyId);
    const generalAvg = data.getSectionAverage(s.id);
    const diff = avg - generalAvg;
    const cls = getClassification(avg);
    return [s.name, avg.toFixed(2), cls.label, `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`];
  });

  autoTable(doc, {
    startY: 86,
    head: [["Pilar", "Média", "Classificação", "vs. Geral"]],
    body: sectionRows,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, fontSize: 8, font: "helvetica" },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center" } },
    didParseCell(cellData) {
      if (cellData.section === "body" && cellData.column.index === 2) {
        const cls = getClassification(parseFloat(sectionRows[cellData.row.index][1]));
        cellData.cell.styles.textColor = cls.color;
        cellData.cell.styles.fontStyle = "bold";
      }
      if (cellData.section === "body" && cellData.column.index === 3) {
        const val = parseFloat(sectionRows[cellData.row.index][3]);
        cellData.cell.styles.textColor = val >= 0 ? COLORS.success : COLORS.danger;
        cellData.cell.styles.fontStyle = "bold";
      }
    },
  });

  // Strengths & Critical
  const allQAvg = availableQuestions.map(q => ({ ...q, avg: data.getQuestionAverage(q.id, companyId) }));

  const strengths = [...allQAvg].sort((a, b) => {
    const isNegA = a.section === "vivencias" || a.section === "saude";
    const isNegB = b.section === "vivencias" || b.section === "saude";
    return (isNegB ? 6 - b.avg : b.avg) - (isNegA ? 6 - a.avg : a.avg);
  }).slice(0, 5);

  const critical = [...allQAvg].sort((a, b) => {
    const isNegA = a.section === "vivencias" || a.section === "saude";
    const isNegB = b.section === "vivencias" || b.section === "saude";
    return (isNegB ? b.avg : 6 - b.avg) - (isNegA ? a.avg : 6 - a.avg);
  }).slice(0, 5);

  const currentY = (doc as any).lastAutoTable?.finalY || 140;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.success);
  doc.text("✓ Pontos Fortes", 15, currentY + 10);

  strengths.forEach((q, i) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(`${i + 1}. ${q.text} (${q.avg.toFixed(1)})`, 20, currentY + 17 + i * 5);
  });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.danger);
  doc.text("✗ Pontos Críticos", 110, currentY + 10);

  critical.forEach((q, i) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(`${i + 1}. ${q.text} (${q.avg.toFixed(1)})`, 115, currentY + 17 + i * 5);
  });

  // Demographics page
  doc.addPage();
  page++;
  addHeader(doc, company.name, "Perfil Demográfico");

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Distribuição por Gênero", 15, 50);

  const sexGroups = ["Masculino", "Feminino", "Prefiro não declarar"];
  const sexRows = sexGroups.map(sex => {
    const count = pool.filter((r: any) => r.sex === sex).length;
    const pct = pool.length > 0 ? Math.round((count / pool.length) * 100) : 0;
    return [sex, count.toString(), `${pct}%`];
  });

  autoTable(doc, {
    startY: 54,
    head: [["Gênero", "Quantidade", "%"]],
    body: sexRows,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
  });

  const genderEndY = (doc as any).lastAutoTable?.finalY || 90;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Distribuição por Faixa Etária", 15, genderEndY + 12);

  const ageRanges = [
    { label: "18-25", min: 18, max: 25 },
    { label: "26-35", min: 26, max: 35 },
    { label: "36-45", min: 36, max: 45 },
    { label: "46-55", min: 46, max: 55 },
    { label: "56+", min: 56, max: 100 },
  ];
  const ageRows = ageRanges.map(r => {
    const count = pool.filter((resp: any) => resp.age >= r.min && resp.age <= r.max).length;
    const pct = pool.length > 0 ? Math.round((count / pool.length) * 100) : 0;
    return [r.label, count.toString(), `${pct}%`];
  });

  autoTable(doc, {
    startY: genderEndY + 16,
    head: [["Faixa Etária", "Quantidade", "%"]],
    body: ageRows,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
  });

  const ageEndY = (doc as any).lastAutoTable?.finalY || 140;

  // Sector distribution
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Distribuição por Setor", 15, ageEndY + 12);

  const sectorMap = new Map<string, number>();
  pool.forEach((r: any) => {
    const s = r.sector || "Não informado";
    sectorMap.set(s, (sectorMap.get(s) || 0) + 1);
  });
  const sectorRows = Array.from(sectorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([sector, count]) => [sector, count.toString(), `${pool.length > 0 ? Math.round((count / pool.length) * 100) : 0}%`]);

  autoTable(doc, {
    startY: ageEndY + 16,
    head: [["Setor", "Quantidade", "%"]],
    body: sectorRows,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
  });

  addFooter(doc, page);

  // Detail pages per section
  availableSections.forEach(s => {
    doc.addPage();
    page++;
    addHeader(doc, company.name, `Detalhamento — ${s.name}`);

    const qs = availableQuestions.filter(q => q.section === s.id);
    const rows = qs.map(q => {
      const avg = data.getQuestionAverage(q.id, companyId);
      const dist = data.getAnswerDistribution(q.id, companyId);
      return [
        `${q.number}`,
        q.text,
        avg.toFixed(2),
        ...dist.map(d => `${d.percentage}%`),
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [["Nº", "Pergunta", "Média", "Nunca", "Raram.", "Às vezes", "Freq.", "Sempre"]],
      body: rows,
      theme: "striped",
      headStyles: { fillColor: COLORS.primary, fontSize: 7, font: "helvetica" },
      bodyStyles: { fontSize: 6.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 55 },
        2: { cellWidth: 12, halign: "center", fontStyle: "bold" },
        3: { cellWidth: 14, halign: "center" },
        4: { cellWidth: 14, halign: "center" },
        5: { cellWidth: 14, halign: "center" },
        6: { cellWidth: 14, halign: "center" },
        7: { cellWidth: 14, halign: "center" },
      },
      didParseCell(cellData) {
        if (cellData.section === "body" && cellData.column.index === 2) {
          const val = parseFloat(cellData.cell.raw as string);
          const cls = getClassification(val);
          cellData.cell.styles.textColor = cls.color;
        }
      },
    });

    addFooter(doc, page);
  });

  // Add first page footer
  doc.setPage(1);
  addFooter(doc, 1);

  doc.save(`relatorio_${company.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportComparisonPDF(companyIds: string[], data: PDFExportData) {
  const selected = data.companies.filter(c => companyIds.includes(c.id));
  if (selected.length < 2) return;

  const doc = new jsPDF("landscape");
  const availableSections = data.getAvailableSections();
  const availableQuestions = data.getAvailableQuestions();
  let page = 1;

  const titleNames = selected.map(c => c.name).join(" vs ");
  addHeader(doc, titleNames.length > 60 ? `${selected.length} Empresas` : titleNames, "Relatório Comparativo");

  // Overview table
  const header = ["Empresa", "Respostas", ...availableSections.map(s => s.shortName), "Média"];
  const rows = selected.map(c => {
    const avgs = availableSections.map(s => data.getSectionAverage(s.id, c.id).toFixed(2));
    const overall = availableSections.length > 0
      ? (availableSections.reduce((acc, s) => acc + data.getSectionAverage(s.id, c.id), 0) / availableSections.length).toFixed(2)
      : "0";
    return [c.name, data.getCompanyRespondents(c.id).length.toString(), ...avgs, overall];
  });

  autoTable(doc, {
    startY: 45,
    head: [header],
    body: rows,
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: Object.fromEntries(
      Array.from({ length: header.length }, (_, i) => [i, { halign: i >= 1 ? "center" : "left" }])
    ),
    didParseCell(cellData) {
      if (cellData.section === "body" && cellData.column.index >= 2 && cellData.column.index <= header.length - 1) {
        const val = parseFloat(cellData.cell.raw as string);
        if (!isNaN(val)) {
          const cls = getClassification(val);
          cellData.cell.styles.textColor = cls.color;
          cellData.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  addFooter(doc, page);

  // Per section comparison
  availableSections.forEach(s => {
    doc.addPage("landscape");
    page++;
    addHeader(doc, `Comparativo — ${s.name}`, "Por Pergunta");

    const qs = availableQuestions.filter(q => q.section === s.id);
    const qHeader = ["Nº", "Pergunta", ...selected.map(c => c.name.length > 15 ? c.name.slice(0, 15) + "…" : c.name)];
    const qRows = qs.map(q => {
      return [q.number.toString(), q.text, ...selected.map(c => data.getQuestionAverage(q.id, c.id).toFixed(2))];
    });

    autoTable(doc, {
      startY: 45,
      head: [qHeader],
      body: qRows,
      theme: "striped",
      headStyles: { fillColor: COLORS.primary, fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 80 },
      },
      didParseCell(cellData) {
        if (cellData.section === "body" && cellData.column.index >= 2) {
          const val = parseFloat(cellData.cell.raw as string);
          if (!isNaN(val)) {
            const cls = getClassification(val);
            cellData.cell.styles.textColor = cls.color;
          }
        }
      },
    });

    addFooter(doc, page);
  });

  doc.save(`comparativo_PROATIVA_${new Date().toISOString().split("T")[0]}.pdf`);
}
