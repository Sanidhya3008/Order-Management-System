import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generatePDF = (title, headers, data) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    doc.autoTable({
        head: [headers],
        body: data,
        startY: 30,
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { cellPadding: 1.5, fontSize: 10 },
    });

    return doc;
};