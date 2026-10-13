import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';


interface Capability {
  title: string;
  description: string;
  tech?: string;
  /** Ruta de la imagen (ej. assets/img/landing/mapa.png). Sin valor se muestra un placeholder. */
  image?: string;
  imageAlt?: string;
  imageFit?: 'contain' | 'bottom';
}

interface Step {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}

interface TeamMember {
  name: string;
  role: string;
  photo: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLinkActive, RouterLink, MatButtonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  protected readonly menuOpen = signal(false);
  protected readonly slide = signal(0);

  protected readonly capabilities: Capability[] = [
    {
      title: 'Mapa geográfico',
      description:
        'Recorre el territorio y consulta los datos de cada zona directamente sobre el mapa.',
      image: 'assets/img/ss-landing/territorio.png',
      imageAlt: 'Mapa geográfico de PATO',
    },
    {
      title: 'Paneles históricos',
      description:
        'Revisa la evolución de los indicadores a nivel nacional, departamental y latinoamericano.',
      image: 'assets/img/ss-landing/panel.png',
      imageAlt: 'Panel histórico de indicadores de PATO',
    },
    {
      title: 'Predicciones del IPM',
      description:
        'Proyecta el Índice de Pobreza Multidimensional de una región a partir de datos históricos.',
      tech: 'Modelos de regresión de aprendizaje supervisado.',
      image: 'assets/img/ss-landing/predicciones.png',
      imageAlt: 'Panel de predicciones del IPM de PATO',
    },
    {
      title: 'Clasificación de regiones',
      description: 'Identifica qué regiones están en pobreza multidimensional y en qué categoría.',
      tech: 'Algoritmos de clasificación de aprendizaje supervisado.',
      image: 'assets/img/ss-landing/regiones.png',
      imageAlt: 'Clasificación de regiones de PATO',
      imageFit: 'bottom',
    },
    {
      title: 'Chatbot',
      description: 'Pregunta a los datos en lenguaje natural y obtén contexto mientras exploras.',
      tech: 'Agente de procesamiento de lenguaje natural (NLP).',
      image: 'assets/img/ss-landing/chatbot.png',
      imageAlt: 'Chatbot de PATO',
    },
    {
      title: 'Exportar a PDF',
      description:
        'Descarga en PDF las predicciones que generas para compartirlas o incluirlas en tus informes.',
      image: 'assets/img/ss-landing/pdf.png',
      imageAlt: 'Exportación de predicciones a PDF en PATO',
      imageFit: 'contain',
    },
  ];

  protected readonly steps: Step[] = [
    {
      title: 'Elige un territorio',
      description: 'Selecciona una región, un país o un departamento.',
      image: 'assets/img/ss-landing/costarica1.png',
      imageAlt: 'Selección de un territorio en PATO',
    },
    {
      title: 'Consulta el histórico',
      description: 'Revisa cómo han cambiado los indicadores con el tiempo.',
      image: 'assets/img/ss-landing/costarica2.png',
      imageAlt: 'Consulta del histórico de indicadores en PATO',
    },
    {
      title: 'Compara',
      description: 'Contrasta dimensiones, variables o periodos.',
      image: 'assets/img/ss-landing/costarica3.png',
      imageAlt: 'Comparación de indicadores en PATO',
    },
    {
      title: 'Explora lo que viene',
      description: 'Mira las predicciones, consulta al chatbot y exporta los resultados a PDF.',
      image: 'assets/img/ss-landing/costarica4.png',
      imageAlt: 'Exploración de predicciones en PATO',
    },
  ];

  // Placeholders: reemplazar nombre, rol y foto (p. ej. assets/img/team/nombre.jpg).
  protected readonly team: TeamMember[] = [
    { name: 'Nathalia Rojas', role: 'Ingeniera Backend, PM', photo: 'assets/img/pato.png' },
    { name: 'Danna Garzón', role: 'Ingeniera de IA', photo: 'assets/img/pato.png' },
    { name: 'Dalyalí Porras', role: 'Ingeniera Frontend', photo: 'assets/img/pato.png' },
    { name: 'Christian Duarte', role: 'Ingeniero de Infraestructura', photo: 'assets/img/pato.png' },
    { name: 'Carlos Pimiento', role: 'Ingeniero Backend', photo: 'assets/img/pato.png' },
    { name: 'Eduard Mojica', role: 'Ingeniero Frontend, DBA', photo: 'assets/img/pato.png' },
  ];

  protected nextSlide(): void {
    this.slide.update((i) => (i + 1) % this.capabilities.length);
  }

  protected prevSlide(): void {
    this.slide.update((i) => (i - 1 + this.capabilities.length) % this.capabilities.length);
  }

  protected goToSlide(index: number): void {
    this.slide.set(index);
  }

  protected changeSlideFromImage(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const { left, width } = target.getBoundingClientRect();
    if (event instanceof MouseEvent && event.clientX - left < width / 2) {
      this.prevSlide();
      return;
    }

    this.nextSlide();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}