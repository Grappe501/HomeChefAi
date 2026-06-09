/** Default renameable Sous Chef — never display literal role string as the name. */
export function assistantFirstName(name?: string | null): string {
  if (!name || name.trim() === '' || name === 'Sous Chef') return 'Clara';
  return name;
}

export function sousChefLabel(name?: string | null): string {
  return `Sous Chef ${assistantFirstName(name)}`;
}
