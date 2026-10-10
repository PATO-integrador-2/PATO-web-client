import { Injectable, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Chart } from 'chart.js';
import { firstValueFrom } from 'rxjs';
import {
  ExportPdfDialog,
  ExportPdfDialogData,
} from '../../../components/export-pdf-dialog/export-pdf-dialog';
import {
  ExportWidget,
  PdfExportError,
  PdfExportService,
  suggestedPdfFileName,
} from './pdf-export.service';

export interface PredictionView {
  /** Título que aparece en el PDF. */
  title: string;
  /** Para el nombre sugerido: 'colombia' | 'latinoamerica'. */
  slug: string;
}

function readCardTitle(card: HTMLElement): string {
  const header = card.querySelector('.card-header');
  if (!header) return '';
  const clone = header.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('button, mat-icon').forEach((node) => node.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Tarjetas visibles con canvas, en el mismo orden del DOM (orden visual). */
export function collectExportableWidgets(host: HTMLElement | null): ExportWidget[] {
  if (!host) return [];
  const cards = Array.from(host.querySelectorAll<HTMLElement>('.dashboard-card'));
  return cards.flatMap((card, index) => {
    const canvas = card.querySelector('canvas');
    return canvas ? [{ title: readCardTitle(card) || `Gráfico ${index + 1}`, canvas }] : [];
  });
}

@Injectable({ providedIn: 'root' })
export class PredictionPdfExportService {
  private readonly pdf = inject(PdfExportService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly busy = signal(false);

  countExportable(host: HTMLElement | null): number {
    return collectExportableWidgets(host).length;
  }

  async run(host: HTMLElement | null, view: PredictionView): Promise<void> {
    if (this.busy() || this.countExportable(host) === 0) return;
    this.busy.set(true);
    try {
      const name = await firstValueFrom(
        this.dialog
          .open<ExportPdfDialog, ExportPdfDialogData, string>(ExportPdfDialog, {
            width: '420px',
            data: { suggestedName: suggestedPdfFileName(view.slug) },
          })
          .afterClosed(),
      );
      if (!name) return;

      // Se recolecta de nuevo: el DOM pudo cambiar mientras el diálogo estaba abierto.
      const widgets = collectExportableWidgets(host);
      if (widgets.some((w) => !Chart.getChart(w.canvas))) {
        throw new PdfExportError('Algunos gráficos aún se están cargando. Inténtalo de nuevo.');
      }
      await this.pdf.export({ viewTitle: view.title, widgets }, name);
    } catch (error) {
      const message =
        error instanceof PdfExportError
          ? error.message
          : 'No se pudo generar el PDF. Inténtalo de nuevo.';
      this.snackBar.open(message, 'Cerrar', { duration: 6000 });
    } finally {
      this.busy.set(false);
    }
  }
}