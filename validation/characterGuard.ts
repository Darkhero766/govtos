export const BLOCKED_INCIDENT_CHARACTERS = ['#', '$', '@', '*', '`', "'", '~', '|', '!'] as const;

export interface CharacterGuardResult {
  blocked: boolean;
  characters: string[];
  message: string;
}

export function checkIncidentCharacters(value: string): CharacterGuardResult {
  const characters = Array.from(new Set(value.split('').filter((character) => BLOCKED_INCIDENT_CHARACTERS.includes(character as (typeof BLOCKED_INCIDENT_CHARACTERS)[number]))));
  if (!characters.length) return { blocked: false, characters: [], message: '' };
  return {
    blocked: true,
    characters,
    message: `This field on the real portal may reject ${characters.join(' ')}. They can appear in UPI IDs, email addresses and URLs, so keep the original evidence and tell the reviewer exactly what was entered.`,
  };
}
