/** Abas da página do projeto; o slug é o último pedaço do endereço. */
export const PROJECT_SECTIONS = [
  { slug: '', label: 'Tarefas' },
  { slug: 'anotacoes', label: 'Anotações' },
  { slug: 'ideias', label: 'Ideias' },
  { slug: 'bloqueios', label: 'Bloqueios' },
  { slug: 'avancos', label: 'Avanços' },
] as const;

export type ProjectSectionSlug = (typeof PROJECT_SECTIONS)[number]['slug'];

/** Slug do endereço → aba; null se não existir (endereço digitado à mão). */
export function parseProjectSection(slug: string | undefined): ProjectSectionSlug | null {
  return PROJECT_SECTIONS.find((section) => section.slug === (slug ?? ''))?.slug ?? null;
}

export const projectPath = (projectId: string, slug: ProjectSectionSlug = '') =>
  slug ? `/trabalho/projetos/${projectId}/${slug}` : `/trabalho/projetos/${projectId}`;
