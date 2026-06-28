const stack: string[] = [
  "Next.js 16",
  "TypeScript",
  "Tailwind v4",
  "shadcn/ui",
  "NestJS",
  "Prisma ORM",
  "PostgreSQL",
  "BetterAuth",
  "TanStack Query",
  "TanStack Form",
  "Zod",
  "OpenAI API",
];

export function StackSection() {
  return (
    <section
      aria-labelledby="stack-title"
      className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2
          id="stack-title"
          className="font-display text-3xl font-extrabold tracking-tight md:text-5xl"
        >
          Construído com tecnologia de verdade.
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          Não é projeto de CRUD. É arquitetura pensada pra escalar.
        </p>
      </div>

      <ul
        aria-label="Lista de tecnologias usadas"
        className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {stack.map((tech) => (
          <li
            key={tech}
            className="rounded-xl border border-foreground/5 bg-brl-card px-4 py-3 text-center text-sm font-medium text-brl-muted transition-colors hover:border-brl-purple hover:text-foreground"
          >
            {tech}
          </li>
        ))}
      </ul>
    </section>
  );
}
