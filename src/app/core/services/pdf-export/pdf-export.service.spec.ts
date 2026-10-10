import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  PdfExportError,
  PdfExportService,
  normalizePdfFileName,
  suggestedPdfFileName,
} from './pdf-export.service';

class FakeJsPdf {
  static instances: FakeJsPdf[] = [];
  internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
  setFont = vi.fn();
  setFontSize = vi.fn();
  splitTextToSize = vi.fn((text: string) => [text]);
  text = vi.fn();
  addImage = vi.fn();
  addPage = vi.fn();
  save = vi.fn();
  constructor() {
    FakeJsPdf.instances.push(this);
  }
}

function canvas(width: number, height: number, url = 'data:image/png;base64,AAA') {
  return { width, height, toDataURL: vi.fn(() => url) } as unknown as HTMLCanvasElement;
}

describe('PdfExportService', () => {
  let service: PdfExportService;
  let loadSpy: ReturnType<typeof vi.fn>;

  function setup(platform: 'browser' | 'server' = 'browser') {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
    service = TestBed.inject(PdfExportService);
    loadSpy = vi.fn().mockResolvedValue({ jsPDF: FakeJsPdf });
    (service as unknown as { loadJsPdf: unknown }).loadJsPdf = loadSpy;
  }

  beforeEach(() => {
    FakeJsPdf.instances = [];
  });

  it('genera un PDF con un widget y conserva títulos y nombre de la vista', async () => {
    setup();
    await service.export(
      { viewTitle: 'Predicciones de Colombia', widgets: [{ title: 'IPM nacional', canvas: canvas(600, 300) }] },
      'mi reporte',
    );
    const doc = FakeJsPdf.instances[0];
    const texts = doc.text.mock.calls.flatMap((c) => c[0] as string[] | string);
    expect(texts).toContain('Predicciones de Colombia');
    expect(texts).toContain('IPM nacional');
    expect(doc.addImage).toHaveBeenCalledTimes(1);
    expect(doc.save).toHaveBeenCalledTimes(1);
    expect(doc.save).toHaveBeenCalledWith('mi reporte.pdf');
  });

  it('respeta el orden de varios widgets y captura con toDataURL', async () => {
    setup();
    const a = canvas(600, 300, 'data:image/png;base64,AAA');
    const b = canvas(600, 300, 'data:image/png;base64,BBB');
    await service.export(
      { viewTitle: 'Vista', widgets: [{ title: 'A', canvas: a }, { title: 'B', canvas: b }] },
      'x',
    );
    const images = FakeJsPdf.instances[0].addImage.mock.calls.map((c) => c[0]);
    expect(images).toEqual(['data:image/png;base64,AAA', 'data:image/png;base64,BBB']);
    expect(a.toDataURL).toHaveBeenCalledWith('image/png');
  });

  it('mantiene la proporción del canvas', async () => {
    setup();
    await service.export({ viewTitle: 'V', widgets: [{ title: 'A', canvas: canvas(600, 300) }] }, 'x');
    const [, , , , w, h] = FakeJsPdf.instances[0].addImage.mock.calls[0];
    expect(h / w).toBeCloseTo(0.5);
  });

  it('añade páginas cuando no hay espacio', async () => {
    setup();
    await service.export(
      { viewTitle: 'V', widgets: [{ title: 'A', canvas: canvas(600, 600) }, { title: 'B', canvas: canvas(600, 600) }] },
      'x',
    );
    expect(FakeJsPdf.instances[0].addPage).toHaveBeenCalled();
  });

  it('reduce un gráfico muy alto sin deformarlo', async () => {
    setup();
    await service.export({ viewTitle: 'V', widgets: [{ title: 'A', canvas: canvas(300, 1200) }] }, 'x');
    const [, , , , w, h] = FakeJsPdf.instances[0].addImage.mock.calls[0];
    expect(h).toBeLessThanOrEqual(267);
    expect(h / w).toBeCloseTo(4);
  });

  it('no descarga si no hay widgets', async () => {
    setup();
    await expect(service.export({ viewTitle: 'V', widgets: [] }, 'x')).rejects.toBeInstanceOf(PdfExportError);
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('falla sin descargar si toDataURL lanza error', async () => {
    setup();
    const bad = { width: 10, height: 10, toDataURL: () => { throw new Error('tainted'); } } as unknown as HTMLCanvasElement;
    await expect(
      service.export({ viewTitle: 'V', widgets: [{ title: 'A', canvas: canvas(10, 10) }, { title: 'B', canvas: bad }] }, 'x'),
    ).rejects.toBeInstanceOf(PdfExportError);
    expect(FakeJsPdf.instances.length).toBe(0);
  });

  it('falla si el canvas no tiene dimensiones', async () => {
    setup();
    await expect(
      service.export({ viewTitle: 'V', widgets: [{ title: 'A', canvas: canvas(0, 0) }] }, 'x'),
    ).rejects.toBeInstanceOf(PdfExportError);
  });

  it('no se ejecuta en el servidor (SSR)', async () => {
    setup('server');
    await expect(
      service.export({ viewTitle: 'V', widgets: [{ title: 'A', canvas: canvas(10, 10) }] }, 'x'),
    ).rejects.toBeInstanceOf(PdfExportError);
    expect(loadSpy).not.toHaveBeenCalled();
  });
});

describe('normalizePdfFileName', () => {
  it('agrega la extensión .pdf', () => {
    expect(normalizePdfFileName('reporte')).toBe('reporte.pdf');
  });
  it('no duplica la extensión', () => {
    expect(normalizePdfFileName('reporte.PDF')).toBe('reporte.pdf');
  });
  it('elimina caracteres inválidos', () => {
    expect(normalizePdfFileName('a/b:c*?')).toBe('abc.pdf');
  });
  it('rechaza nombres vacíos o solo con caracteres inválidos', () => {
    expect(() => normalizePdfFileName('   ')).toThrow(PdfExportError);
    expect(() => normalizePdfFileName('///')).toThrow(PdfExportError);
  });
});

describe('suggestedPdfFileName', () => {
  it('usa la vista y la fecha local', () => {
    expect(suggestedPdfFileName('colombia', new Date(2026, 9, 9))).toBe(
      'predicciones-colombia-2026-10-09.pdf',
    );
  });
});