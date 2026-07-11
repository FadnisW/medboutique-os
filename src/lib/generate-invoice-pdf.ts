import jsPDF from "jspdf";

interface InvoiceData {
  invoiceId: string;
  invoiceDate: string;
  invoiceStatus: string;
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicSpecialty: string;
  clinicDoctorName: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  treatmentName: string;
  treatmentDuration: number;
  doctorName: string;
  appointmentDate: string | null;
  amountDue: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  paymentReference: string;
  paymentStatus: string;
  paymentDate: string | null;
}

const TEAL = [13, 148, 136] as [number, number, number];
const DARK = [15, 23, 42] as [number, number, number];
const GRAY = [100, 116, 139] as [number, number, number];
const LIGHT_GRAY = [241, 245, 249] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];

function formatCurrencyINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(val);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // ── Header Band ─────────────────────────────────────
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageWidth, 42, "F");

  // Clinic Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text(data.clinicName.toUpperCase(), margin, 18);

  // Specialty
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.clinicSpecialty, margin, 25);

  // INVOICE label on right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("INVOICE", pageWidth - margin, 18, { align: "right" });

  // Invoice Number below label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(data.invoiceId, pageWidth - margin, 26, { align: "right" });

  // Status badge
  const statusText = data.invoiceStatus;
  doc.setFontSize(9);
  const badgeWidth = doc.getTextWidth(statusText) + 8;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(...WHITE);
  doc.roundedRect(badgeX, 29, badgeWidth, 7, 2, 2, "F");
  doc.setTextColor(...TEAL);
  doc.setFont("helvetica", "bold");
  doc.text(statusText, badgeX + 4, 34);

  y = 50;

  // ── Clinic & Invoice Meta Row ──────────────────────
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("FROM", margin, y);
  doc.text("INVOICE DETAILS", pageWidth / 2 + 10, y);

  y += 5;

  // Clinic details (left column)
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.clinicDoctorName, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  // Wrap clinic address
  const addressLines = doc.splitTextToSize(data.clinicAddress, contentWidth / 2 - 10);
  doc.text(addressLines, margin, y);
  y += addressLines.length * 4 + 1;

  doc.text(`Phone: ${data.clinicPhone}`, margin, y);

  // Invoice details (right column)
  let rightY = 55;
  const rightX = pageWidth / 2 + 10;
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const metaRows = [
    ["Invoice Date:", formatDate(data.invoiceDate)],
    ["Payment Ref:", data.paymentReference],
    ["Payment Date:", formatDate(data.paymentDate)],
  ];

  metaRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(label, rightX, rightY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(value, rightX + 35, rightY);
    rightY += 5;
  });

  y = Math.max(y, rightY) + 8;

  // ── Patient / Bill To Section ──────────────────────
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, "F");

  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("BILL TO", margin + 5, y + 6);

  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(data.patientName, margin + 5, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`${data.patientEmail}  |  ${data.patientPhone}`, margin + 5, y + 18);

  y += 30;

  // ── Services Table ─────────────────────────────────
  // Table header
  doc.setFillColor(...DARK);
  doc.roundedRect(margin, y, contentWidth, 9, 2, 2, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  const colX = {
    service: margin + 5,
    provider: margin + contentWidth * 0.45,
    duration: margin + contentWidth * 0.65,
    amount: margin + contentWidth - 5,
  };

  doc.text("SERVICE", colX.service, y + 6);
  doc.text("PROVIDER", colX.provider, y + 6);
  doc.text("DURATION", colX.duration, y + 6);
  doc.text("AMOUNT", colX.amount, y + 6, { align: "right" });

  y += 12;

  // Table row
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(data.treatmentName, colX.service, y + 5);
  doc.text(data.doctorName, colX.provider, y + 5);
  doc.text(`${data.treatmentDuration} mins`, colX.duration, y + 5);
  doc.setFont("helvetica", "bold");
  doc.text(formatCurrencyINR(data.amountDue), colX.amount, y + 5, { align: "right" });

  if (data.appointmentDate) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(`Appointment: ${formatDateTime(data.appointmentDate)}`, colX.service, y + 10);
  }

  y += 16;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  y += 4;

  // ── Financials Summary ─────────────────────────────
  const summaryX = margin + contentWidth * 0.6;
  const valueX = margin + contentWidth - 5;

  const summaryRows: [string, string, boolean][] = [
    ["Subtotal", formatCurrencyINR(data.amountDue), false],
    ["Tax (Inclusive)", "₹0.00", false],
    ["Amount Paid", formatCurrencyINR(data.amountPaid), false],
  ];

  summaryRows.forEach(([label, value, isBold]) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label, summaryX, y);
    doc.setTextColor(...DARK);
    doc.text(value, valueX, y, { align: "right" });
    y += 6;
  });

  // Balance Due (prominent)
  y += 2;
  doc.setFillColor(...(data.balanceDue > 0 ? [254, 243, 199] as [number, number, number] : [209, 250, 229] as [number, number, number]));
  doc.roundedRect(summaryX - 5, y - 4, contentWidth * 0.4 + 10, 10, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...(data.balanceDue > 0 ? [146, 64, 14] as [number, number, number] : [5, 150, 105] as [number, number, number]));
  doc.text("BALANCE DUE", summaryX, y + 3);
  doc.text(formatCurrencyINR(data.balanceDue), valueX, y + 3, { align: "right" });

  y += 20;

  // ── Footer Notes ───────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);

  const notes = [
    "• This is a computer-generated invoice and does not require a physical signature.",
    "• Payment is non-refundable unless the clinic cancels the appointment.",
    `• For billing inquiries, contact us at ${data.clinicPhone}.`,
    `• ${data.clinicName} — ${data.clinicAddress}`,
  ];

  notes.forEach((note) => {
    doc.text(note, margin, y);
    y += 4;
  });

  // ── Bottom Branding Line ───────────────────────────
  y = doc.internal.pageSize.getHeight() - 10;
  doc.setFillColor(...TEAL);
  doc.rect(0, y, pageWidth, 10, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`${data.clinicName}  •  ${data.clinicSpecialty}  •  ${data.clinicPhone}`, pageWidth / 2, y + 6, { align: "center" });

  // Save
  doc.save(`${data.invoiceId}.pdf`);
}
