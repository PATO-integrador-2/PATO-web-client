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

  it('muestra un carrusel de seis funcionalidades y una cascada de cuatro pasos', () => {
    expect(element.querySelectorAll('.dot').length).toBe(6);
    expect(element.querySelectorAll('.slide').length).toBe(1);
    expect(element.querySelectorAll('.cascade__row').length).toBe(4);
  });

  it('el carrusel avanza, retrocede y marca el punto activo', async () => {
    const title = () => element.querySelector('.slide__caption h3')?.textContent?.trim();
    const first = title();
    (element.querySelector('.arrow--next') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(title()).not.toBe(first);
    expect(element.querySelectorAll('.dot')[1].getAttribute('aria-current')).toBe('true');

    (element.querySelector('.arrow:not(.arrow--next)') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(title()).toBe(first);
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