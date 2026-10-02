// Regras por nome (ExerciseDB não traz impacto/articulação): `soft` só vale se não houver alternativa.
type Rule = { pattern: RegExp; soft?: boolean };

export const LIMITATION_RULES: Record<string, Rule[]> = {
  knee: [{ pattern: /lunge|jump|hop\b|pistol|plyo|burpee|skater|sissy|bound|split squat|step[- ]?up|on knees|slide/i }],
  lower_back: [{ pattern: /deadlift|good morning|bent[- ]over|stiff[- ]leg|hyperextension|back extension|superman|clean|snatch/i }],
  shoulder: [{ pattern: /overhead|military|behind (the )?(neck|head)|arnold|handstand|upright row|snatch|jerk|shoulder press|push press|(?<!hanging )pike/i }],
  wrist: [{ pattern: /handstand|planche|crawl/i }, { pattern: /push[- ]?up|plank|burpee|bear/i, soft: true }],
  hip: [{ pattern: /sumo|lateral lunge|lunge|pistol|jump|fire hydrant|hip thrust|kick/i }],
};

// Fora do plano de força/hipertrofia: alongamento, mobilidade e aquecimento.
export const NOT_STRENGTH = /stretch|mobility|foam|release|warm[- ]?up|rotation|circles|pose|boxing|hook|twist|toe touch|balance|wiper|reach|clasped|sequence|mountain climber|sprint|quick feet/i;

// Calistenia avançada: só entra para nível avançado.
export const ADVANCED_ONLY = /planche|muscle[- ]?up|one[- ]arm|single[- ]arm|archer|pistol|impossible|human flag|lever|l-sit|kipping|clap|handstand|dragon|typewriter|weighted|depth jump|single[- ]leg squat|clock push|l-pull|plyo/i;

// Levantamentos olímpicos: só para intermediário e avançado.
export const OLYMPIC = /clean|snatch|jerk|high pull/i;

// Exige barra fixa, paralelas ou argolas: fora do plano em casa.
export const NEEDS_BAR = /pull[- ]?up|chin[- ]?up|muscle[- ]?up|\bdips?\b|hanging|rings?\b|inverted row/i;

export type Avoid = "hard" | "soft" | "ok";

export function avoidLevel(name: string, limitations: string[]): Avoid {
  const rules = limitations.flatMap((l) => LIMITATION_RULES[l] ?? []).filter((r) => r.pattern.test(name));
  if (rules.length === 0) return "ok";
  return rules.some((r) => !r.soft) ? "hard" : "soft";
}
