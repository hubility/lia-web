const TOOTH_TYPE_PT: Record<string, string> = {
  "Central Incisor": "Incisivo central",
  "Lateral Incisor": "Incisivo lateral",
  Canine: "Canino",
  "First Premolar": "Primeiro pré-molar",
  "Second Premolar": "Segundo pré-molar",
  "First Molar": "Primeiro molar",
  "Second Molar": "Segundo molar",
  "Third Molar": "Terceiro molar",
};

/** Traduce el tipo de diente que devuelve react-odontogram (en inglés) a PT-BR. */
export function toothTypePt(type: string): string {
  return TOOTH_TYPE_PT[type] ?? type;
}
