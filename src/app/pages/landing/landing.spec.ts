import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Landing } from './landing';

describe('Landing', () => {
  let fixture: ComponentFixture<Landing>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renderiza header, main y footer', () => {
    expect(element.querySelector('header')).toBeTruthy();
    expect(element.querySelector('main')).toBeTruthy();
    expect(element.querySelector('footer')).toBeTruthy();
  });

  it('tiene un único h1', () => {
    expect(element.querySelectorAll('h1').length).toBe(1);
  });

  it('muestra seis funcionalidades y cuatro pasos', () => {
    expect(element.querySelectorAll('.capability').length).toBe(6);
    expect(element.querySelectorAll('.step').length).toBe(4);
  });

  it('muestra seis integrantes del equipo', () => {
    expect(element.querySelectorAll('.member').length).toBe(6);
  });

  it('enlaza a registro y login', () => {
    const hrefs = Array.from(element.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/register');
    expect(hrefs).toContain('/login');
  });

  it('muestra misión, visión y espacio para el equipo', () => {
    const titles = Array.from(element.querySelectorAll('.identity h3')).map((h) =>
      h.textContent?.trim(),
    );
    expect(titles).toEqual(['Misión', 'Visión']);
    expect(element.querySelector('.team')).toBeTruthy();
  });

  it('no repite los CTA antes del footer', () => {
    expect(element.querySelector('.cta')).toBeNull();
  });

  it('enlaza a los documentos legales existentes', () => {
    const hrefs = Array.from(element.querySelectorAll('footer a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toContain('assets/legal/data-security.html');
    expect(hrefs).toContain('assets/legal/data-treatment-policy.html');
    expect(hrefs).toContain('assets/legal/terms-&-conditions.html');
  });

  it('alterna aria-expanded en el botón del menú móvil', async () => {
    const toggle = element.querySelector('.menu-toggle') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('todas las imágenes tienen alt', () => {
    const images = Array.from(element.querySelectorAll('img'));
    expect(images.length).toBeGreaterThan(0);
    images.forEach((img) => expect(img.getAttribute('alt')).toBeTruthy());
  });
});