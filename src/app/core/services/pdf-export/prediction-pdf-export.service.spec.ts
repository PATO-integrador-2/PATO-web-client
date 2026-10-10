import { collectExportableWidgets } from './prediction-pdf-export.service';

describe('collectExportableWidgets', () => {
  function hostWith(html: string): HTMLElement {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host;
  }

  it('devuelve título y canvas de cada tarjeta, en orden, sin el botón de eliminar', () => {
    const host = hostWith(`
      <aside class="custom-sidebar-predict"><canvas></canvas></aside>
      <div class="dashboard-card"><div class="card-header"><h3>IPM</h3><button><mat-icon>delete</mat-icon></button></div><canvas></canvas></div>
      <div class="dashboard-card"><div class="card-header"><h3>Sin canvas</h3></div></div>
      <div class="dashboard-card"><div class="card-header"><h3>Sexo</h3></div><canvas></canvas></div>`);
    const widgets = collectExportableWidgets(host);
    expect(widgets.map((w) => w.title)).toEqual(['IPM', 'Sexo']);
  });

  it('ignora el drawer y usa un título de respaldo', () => {
    const host = hostWith('<div class="dashboard-card"><canvas></canvas></div>');
    expect(collectExportableWidgets(host)[0].title).toBe('Gráfico 1');
  });

  it('devuelve vacío sin host o sin tarjetas', () => {
    expect(collectExportableWidgets(null)).toEqual([]);
    expect(collectExportableWidgets(hostWith('<p>nada</p>'))).toEqual([]);
  });
});