import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Capability {
  title: string;
  description: string;
  tech?: string;
}

interface Step {
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  photo: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  protected readonly menuOpen = signal(false);

  protected readonly capabilities: Capability[] = [
    {
      title: 'Mapa geográfico',
      description:
        'Recorre el territorio y consulta los datos de cada zona directamente sobre el mapa.',
    },
    {
      title: 'Paneles históricos',
      description:
        'Revisa la evolución de los indicadores a nivel nacional, departamental y latinoamericano.',
    },
    {
      title: 'Predicciones del IPM',
      description:
        'Proyecta el Índice de Pobreza Multidimensional de una región a partir de datos históricos.',
      tech: 'Modelos de regresión de aprendizaje supervisado.',
    },
    {
      title: 'Clasificación de regiones',
      description: 'Identifica qué regiones están en pobreza multidimensional y en qué categoría.',
      tech: 'Algoritmos de clasificación de aprendizaje supervisado.',
    },
    {
      title: 'Chatbot',
      description: 'Pregunta a los datos en lenguaje natural y obtén contexto mientras exploras.',
      tech: 'Agente de procesamiento de lenguaje natural (NLP).',
    },
    {
      title: 'Exportar a PDF',
      description:
        'Descarga en PDF las predicciones que generas para compartirlas o incluirlas en tus informes.',
    },
  ];

  protected readonly steps: Step[] = [
    {
      title: 'Elige un territorio',
      description: 'Selecciona una región, un país o un departamento.',
    },
    {
      title: 'Consulta el histórico',
      description: 'Revisa cómo han cambiado los indicadores con el tiempo.',
    },
    {
      title: 'Compara',
      description: 'Contrasta dimensiones, variables o periodos.',
    },
    {
      title: 'Explora lo que viene',
      description: 'Mira las predicciones, consulta al chatbot y exporta los resultados a PDF.',
    },
  ];

  // Placeholders: reemplazar nombre, rol y foto (p. ej. assets/img/team/nombre.jpg).
  protected readonly team: TeamMember[] = [
    { name: 'Integrante 1', role: 'Rol del integrante', photo: 'assets/img/pato.png' },
    { name: 'Integrante 2', role: 'Rol del integrante', photo: 'assets/img/pato.png' },
    { name: 'Integrante 3', role: 'Rol del integrante', photo: 'assets/img/pato.png' },
    { name: 'Integrante 4', role: 'Rol del integrante', photo: 'assets/img/pato.png' },
    { name: 'Integrante 5', role: 'Rol del integrante', photo: 'assets/img/pato.png' },
    { name: 'Integrante 6', role: 'Rol del integrante', photo: 'assets/img/pato.png' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}