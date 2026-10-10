import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { jsPDF } from 'jspdf';

export interface ExportWidget {
  title: string;
  canvas: HTMLCanvasElement;
}

export interface PdfExportRequest {
  viewTitle: string;
  widgets: ExportWidget[];
}

interface CapturedWidget {
  title: string;
  dataUrl: string;
  /** alto / ancho reales del canvas */
  ratio: number;
}

export class PdfExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfExportError';
  }
}

/** Quita caracteres inválidos, normaliza la extensión a .pdf y rechaza nombres vacíos. */
export function normalizePdfFileName(raw: string): string {
  const base = (raw ?? '')
    .trim()
    .replace(/\.pdf$/i, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '');
  if (!base) {
    throw new PdfExportError('Escribe un nombre válido para el archivo.');
  }
  return `${base.slice(0, 120)}.pdf`;
}

/** Ej.: predicciones-colombia-2026-10-09.pdf (fecha local, no UTC). */
export function suggestedPdfFileName(slug: string, date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `predicciones-${slug}-${day}.pdf`;
}

const MARGIN = 15; // mm
const GAP = 8; // mm entre widgets
const PT_TO_MM = 0.3528;

@Injectable({ providedIn: 'root' })
export class PdfExportService {
  private readonly platformId = inject(PLATFORM_ID);

  async export(request: PdfExportRequest, rawFileName: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new PdfExportError('La exportación solo está disponible en el navegador.');
    }
    const fileName = normalizePdfFileName(rawFileName);
    if (!request.widgets.length) {
      throw new PdfExportError('No hay gráficos para exportar.');
    }

    // Se captura todo antes de crear el PDF: si algo falla no se descarga nada parcial.
    const captured = request.widgets.map((widget, i) => this.capture(widget, i));

    const { jsPDF: JsPdf } = await this.loadJsPdf();
    const doc = new JsPdf({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    this.render(doc, request.viewTitle, captured);
    doc.save(fileName);
  }

  /** Import dinámico: jsPDF queda fuera del bundle inicial y del servidor SSR. */
  protected loadJsPdf(): Promise<typeof import('jspdf')> {
    return import('jspdf');
  }

  private capture(widget: ExportWidget, index: number): CapturedWidget {
    const title = widget.title || `Gráfico ${index + 1}`;
    const canvas = widget.canvas;
    if (!canvas || !canvas.width || !canvas.height) {
      throw new PdfExportError(`El gráfico "${title}" aún no está listo. Inténtalo de nuevo.`);
    }
    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch {
      throw new PdfExportError(`No se pudo capturar el gráfico "${title}".`);
    }
    if (!dataUrl || !dataUrl.startsWith('data:image/png')) {
      throw new PdfExportError(`No se pudo capturar el gráfico "${title}".`);
    }
    return { title, dataUrl, ratio: canvas.height / canvas.width };
  }

  private render(doc: jsPDF, viewTitle: string, widgets: CapturedWidget[]): void {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const contentW = pageW - MARGIN * 2;
    const lineHeight = (pt: number) => pt * PT_TO_MM * 1.25;

    let y = MARGIN;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    const heading = doc.splitTextToSize(viewTitle, contentW) as string[];
    doc.text(heading, MARGIN, y, { baseline: 'top' });
    y += heading.length * lineHeight(18) + 2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')}`, MARGIN, y, {
      baseline: 'top',
    });
    y += lineHeight(10) + GAP;

    for (const widget of widgets) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(widget.title, contentW) as string[];
      const titleH = lines.length * lineHeight(12) + 3;

      // Proporción conservada: si no cabe en una página, se reduce por alto.
      let imgW = contentW;
      let imgH = imgW * widget.ratio;
      const maxImgH = pageH - MARGIN * 2 - titleH;
      if (imgH > maxImgH) {
        imgH = maxImgH;
        imgW = imgH / widget.ratio;
      }

      if (y + titleH + imgH > pageH - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }

      doc.text(lines, MARGIN, y, { baseline: 'top' });
      doc.addImage(widget.dataUrl, 'PNG', MARGIN, y + titleH, imgW, imgH);
      y += titleH + imgH + GAP;
    }
  }
}