/**
 * NFS Debit Order Mandate PDF Generator
 * Exact word-for-word generation based on official NFS Debit Order Mandate template
 * Used by E&L Digital and NFS Finance for debit order authorization
 */
import { jsPDF } from "jspdf";

export interface MandateFormDetails {
  accountHolder: string;
  address: string;
  bankName: string;
  branchName: string;
  branchCode: string;
  accountNumber: string;
  accountType: "cheque" | "savings" | "transmission" | string;
  date?: string;
  contractDate?: string;
  contractReference: string;
  monthlyAmount?: number;
  interval?: string;
  firstPaymentDate?: string;
  decemberDebitDate?: string;
  trackingFacility?: boolean;
  signatureDataUrl?: string; // Base64 data URL
  assistedBy?: string;
  capacity?: string;
}

export function generateNfsMandatePdf(details: MandateFormDetails): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const today = details.date || new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "2-digit", day: "2-digit" });

  const footerText =
    "NFS Finance A division of NFS Insure Consultant (Pty) Ltd · FSP No. 53910 · NCRCP12678 Eagle Canyon Office Park, Cnr Christiaan De Wet & Dolfyn St, Randpark Ridge, 2154 +27 10 011 0010 · info@nfs.insure · nfs.digital · www.nfs.insure";

  const drawFooter = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 283, pageWidth - margin, 283);
    const splitFooter = doc.splitTextToSize(footerText, contentWidth);
    doc.text(splitFooter, pageWidth / 2, 287, { align: "center" });
  };

  // ══════════════════════════════════════════════════════════════
  // PAGE 1
  // ══════════════════════════════════════════════════════════════
  let y = 18;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("AUTHORITY AND MANDATE FOR PAYMENT INSTRUCTIONS:", margin, y);
  y += 5.5;
  doc.setFontSize(10);
  doc.text("FOR Paper Debit Order Mandates", margin, y);
  y += 8;

  // Section A
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("A. AUTHORITY:", margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.text("GIVEN BY: (NAME OF ACCOUNTHOLDER)", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 148, 136);
  doc.text(` ${details.accountHolder.toUpperCase()}`, margin + 63, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.setDrawColor(180, 190, 205);
  doc.line(margin + 63, y + 1, pageWidth - margin, y + 1);
  y += 5.5;

  doc.text("(ADDRESS)", margin, y);
  doc.setFont("helvetica", "bold");
  doc.text(` ${details.address || "South Africa"}`, margin + 22, y);
  doc.setFont("helvetica", "normal");
  doc.line(margin + 22, y + 1, pageWidth - margin, y + 1);
  y += 6.5;

  doc.setFont("helvetica", "bold");
  doc.text("(BANK ACCOUNT DETAILS):", margin, y);
  y += 5.5;

  // Bank table
  const col1 = margin;
  const colVal = margin + 55;

  doc.setFont("helvetica", "normal");
  doc.text("BANK NAME", col1, y);
  doc.setFont("helvetica", "bold");
  doc.text(details.bankName, colVal, y);
  doc.setFont("helvetica", "normal");
  doc.line(colVal - 2, y + 1, pageWidth - margin, y + 1);
  y += 5;

  doc.text("BRANCH NAME AND TOWN", col1, y);
  doc.setFont("helvetica", "bold");
  doc.text(details.branchName || "Universal / Digital", colVal, y);
  doc.setFont("helvetica", "normal");
  doc.line(colVal - 2, y + 1, pageWidth - margin, y + 1);
  y += 5;

  doc.text("BRANCH NUMBER", col1, y);
  doc.setFont("helvetica", "bold");
  doc.text(details.branchCode, colVal, y);
  doc.setFont("helvetica", "normal");
  doc.line(colVal - 2, y + 1, colVal + 40, y + 1);
  y += 5;

  doc.text("ACCOUNT NUMBER", col1, y);
  doc.setFont("helvetica", "bold");
  doc.text(details.accountNumber, colVal, y);
  doc.setFont("helvetica", "normal");
  doc.line(colVal - 2, y + 1, colVal + 55, y + 1);
  y += 5;

  const typeStr = (details.accountType || "cheque").toLowerCase();
  doc.text("TYPE OF ACCOUNT:", col1, y);
  doc.setFont("helvetica", "bold");
  const chequeLabel = typeStr.includes("cheque") || typeStr.includes("current") ? "[X] CURRENT (CHEQUE)" : "[ ] CURRENT (CHEQUE)";
  const savingsLabel = typeStr.includes("saving") ? "[X] SAVINGS" : "[ ] SAVINGS";
  const transLabel = typeStr.includes("trans") ? "[X] TRANSMISSION" : "[ ] TRANSMISSION";
  doc.text(`${chequeLabel}   ${savingsLabel}   ${transLabel}`, colVal, y);
  doc.setFont("helvetica", "normal");
  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("*(DELETE WHERE NOT APPLICABLE)", colVal, y);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  y += 5;

  doc.text("DATE:", col1, y);
  doc.setFont("helvetica", "bold");
  doc.text(today, colVal, y);
  doc.setFont("helvetica", "normal");
  doc.line(colVal - 2, y + 1, colVal + 45, y + 1);
  y += 5.5;

  doc.text("TO: (NAME OF BENEFICIARY /COMPANY)", col1, y);
  doc.setFont("helvetica", "bold");
  doc.text("E&L Digital Holdings (Pty) Ltd / NFS Finance", colVal + 15, y);
  doc.setFont("helvetica", "normal");
  doc.line(colVal + 15, y + 1, pageWidth - margin, y + 1);
  y += 5;

  doc.text("Abbreviated Short Name as registered with Acquiring bank:", col1, y);
  doc.setFont("helvetica", "bold");
  doc.text("EANDL / NFS FINANCE", margin + 85, y);
  doc.setFont("helvetica", "normal");
  doc.line(margin + 85, y + 1, pageWidth - margin, y + 1);
  y += 5;

  doc.text("(ADDRESS)", col1, y);
  doc.text("Eagle Canyon Office Park, Cnr Christiaan De Wet & Dolfyn St, Randpark Ridge, 2154", col1 + 20, y);
  doc.line(col1 + 20, y + 1, pageWidth - margin, y + 1);
  y += 5.5;

  doc.text("REFER TO OUR CONTRACT DATED", col1, y);
  doc.setFont("helvetica", "bold");
  doc.text(details.contractDate || today, col1 + 55, y);
  doc.setFont("helvetica", "normal");
  doc.text("(“the Agreement”)", col1 + 80, y);
  doc.line(col1 + 55, y + 1, col1 + 78, y + 1);
  y += 6.5;

  // Authority Body Paragraphs
  const p1 =
    "I/We hereby authorise E&L Digital Holdings (Pty) Ltd / NFS Finance to issue and deliver payment instructions to your banker for collection against my/our above-mentioned account at my/our abovementioned bank.";
  const p2 =
    "The individual payment instructions so authorised to be issued, must be issued and delivered monthly / bi-monthly / three-monthly / six-monthly / annually /weekly / bi-weekly* (interval: MONTHLY) on the date when the obligation in terms of the Agreement is due and the amount of each individual payment instruction may not differ as agreed to in terms of the Agreement. *(delete what is not applicable)";
  const p3 =
    "The payment instructions so authorised to be issued, must carry a number, which number must be included in the said payment instructions and if provided to you should enable you to identify the Agreement on your bank statement. The said number should be added to this form in section E before the issuing of any payment instruction and communicated to me directly after having been completed by you.";
  const p4 = `I/we agree that the first payment instruction will be issued and delivered on ${details.firstPaymentDate || today} (date) and thereafter regularly according to the agreement, * except for payment instructions due in December which may be debited against my account on ${details.decemberDebitDate || "standard scheduled date"} *(if applicable).`;
  const p5 =
    "If however, the date of the payment instruction falls on a non-processing day (weekend or public holiday) I agree that the payment instruction may be debited against my account on the following business day; or The date of the instruction falls on a non-processing day (weekend or public holiday) I agree that the payment instruction may be debited against my account on the business day prior to then on-processing day.";
  const p6 =
    "To allow for tracking of dates to match with flow of Credit at no additional cost to myself.\nI authorise the originator to make use of the tracking facility as provided for in the EDO system at no additional cost to myself.   [X] AUTHORIZED";
  const p7 =
    "Subsequent payment instructions will continue to be delivered in terms of this authority until the obligations in terms of the Agreement have been paid or until this authority is cancelled by me/us by giving you notice in writing of not less than the interval (as indicated in the previous clause) and sent by prepaid registered post or delivered to your address indicated above.";

  const paragraphs = [p1, p2, p3, p4, p5, p6, p7];
  doc.setFontSize(7.8);
  doc.setTextColor(30, 41, 59);

  for (const p of paragraphs) {
    const lines = doc.splitTextToSize(p, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 3.6 + 2.2;
  }

  // Section B
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("B. MANDATE", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  const mandateText =
    "I/we acknowledge that all payment instructions issued by you shall be treated by my/our above-mentioned bank as if the instructions had been issued by me/us personally.";
  const mandateLines = doc.splitTextToSize(mandateText, contentWidth);
  doc.text(mandateLines, margin, y);
  y += mandateLines.length * 3.6 + 2.5;

  // Section C Header on Page 1
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("C. CANCELLATION", margin, y);

  drawFooter();

  // ══════════════════════════════════════════════════════════════
  // PAGE 2
  // ══════════════════════════════════════════════════════════════
  doc.addPage();
  y = 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(30, 41, 59);
  const cancelText =
    "I/we agree that although this authority and mandate may be cancelled by me/us, such cancellation will not cancel the Agreement. I/we also understand that I/we cannot reclaim amounts, which have been withdrawn from my/our account (paid) in terms of this authority and mandate if such amounts were legally owing to you.";
  const cancelLines = doc.splitTextToSize(cancelText, contentWidth);
  doc.text(cancelLines, margin, y);
  y += cancelLines.length * 3.8 + 6;

  // Section D
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("D. ASSIGNMENT:", margin, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  const assignText =
    "I/We acknowledge that this authority may be ceded or assigned to a third party if the Agreement is also ceded or assigned to that third party.";
  const assignLines = doc.splitTextToSize(assignText, contentWidth);
  doc.text(assignLines, margin, y);
  y += assignLines.length * 3.8 + 8;

  // Signing block
  doc.setFont("helvetica", "normal");
  doc.text(`Signed at ${details.branchName || "Digital Portal, South Africa"} on this ${today}.`, margin, y);
  y += 6;

  // Digital Signature box with Official Verification Stamp
  doc.setDrawColor(13, 148, 136);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 44, 2, 2, "FD");

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 148, 136);
  doc.text("DIGITAL SIGNATURE AS USED FOR OPERATING ON THE ACCOUNT", margin + 4, y + 5);

  // Left side: Signature drawing / image
  if (details.signatureDataUrl && details.signatureDataUrl.startsWith("data:image")) {
    try {
      doc.addImage(details.signatureDataUrl, "PNG", margin + 6, y + 8, 65, 26);
    } catch (e) {
      console.warn("Could not embed signature image in PDF:", e);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(13, 148, 136);
      doc.text(details.accountHolder, margin + 8, y + 22);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(13, 148, 136);
    doc.text(details.accountHolder, margin + 8, y + 22);
  }

  // Right side: Official Security Verification Stamp Box
  const stampX = margin + 76;
  const stampY = y + 7;
  const stampW = contentWidth - 80;
  const stampH = 33;

  doc.setDrawColor(16, 185, 129);
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(stampX, stampY, stampW, stampH, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(5, 150, 105);
  doc.text("[✓] DIGITALLY SIGNED & VERIFIED ONLINE", stampX + 4, stampY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Signatory: ${details.accountHolder}`, stampX + 4, stampY + 11.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(`Capacity: ${details.capacity || "Account Holder / Authorised Director"}`, stampX + 4, stampY + 16.5);
  doc.text(`Reference: ${details.contractReference}`, stampX + 4, stampY + 21.5);
  doc.text(`Timestamp: ${today} (SAST / UTC+2)`, stampX + 4, stampY + 26);

  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text("Compliance: RSA Electronic Communications & Transactions Act 25 of 2002", stampX + 4, stampY + 30.5);

  y += 50;

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`ASSISTED BY: ${details.assistedBy || "N/A"}`, margin, y);
  doc.text(`CAPACITY: ${details.capacity || "Account Holder"}`, margin + 70, y);
  y += 8;

  // Section E: FOR OFFICE USE
  doc.setDrawColor(13, 148, 136);
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(margin, y, contentWidth, 54, 2, 2, "FD");

  y += 5.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(13, 148, 136);
  doc.text("FOR OFFICE USE", margin + 5, y);
  y += 6;

  doc.setTextColor(15, 23, 42);
  doc.text("E. CONTRACT / AGREEMENT REFERENCE NUMBER", margin + 5, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("THE CONTRACT / AGREEMENT REFERENCE NUMBER IS: ", margin + 5, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(13, 148, 136);
  doc.text(details.contractReference || `EL-${Date.now().toString().slice(-6)}`, margin + 88, y);
  y += 6.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(
    "I/We acknowledge the content of this document and will conduct my mandate with my clients accordingly.",
    margin + 5,
    y
  );
  y += 7.5;

  doc.text("Signature: ", margin + 5, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 148, 136);
  doc.text("E&L Digital Operations Desk [Electronically Countersigned]", margin + 22, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text("Name: Operations Desk Officer", margin + 5, y);
  doc.text("Entity Name: NFS Insure Consultant / E&L Digital", margin + 75, y);
  y += 5.5;

  doc.text(`Date: ${today}`, margin + 5, y);
  doc.text("System Reference: Verified DebiCheck Payment Instruction", margin + 75, y);

  drawFooter();

  return doc;
}

