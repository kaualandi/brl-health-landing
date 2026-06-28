import Link from "next/link";

type FooterLink = { href: string; label: string };

const productLinks: FooterLink[] = [
  { href: "/#produtos", label: "Produtos" },
  { href: "/fit", label: "BRL Fit" },
  { href: "/precos", label: "Planos" },
  { href: "/calculadora", label: "Calculadora" },
  { href: "/conteudos", label: "Conteúdos" },
  { href: "/receitas", label: "Receitas" },
];

const companyLinks: FooterLink[] = [
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
  { href: "/faq", label: "FAQ" },
];

const legalLinks: FooterLink[] = [
  { href: "/termos", label: "Termos de Uso" },
  { href: "/privacidade", label: "Privacidade" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-brl-muted uppercase">
        {title}
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-brl-dark py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-6">
        <div>
          <Link
            href="/"
            className="font-display text-xl font-extrabold tracking-tight"
            aria-label="BRL Health — página inicial"
          >
            <span className="text-brl-purple">BRL</span>
            <span className="text-foreground"> Health</span>
          </Link>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Treino e nutrição que se falam. Do objetivo à conquista.
          </p>
        </div>

        <FooterColumn title="Produto" links={productLinks} />
        <FooterColumn title="Empresa" links={companyLinks} />
        <FooterColumn title="Legal" links={legalLinks} />
      </div>
      <div className="mx-auto mt-10 w-full max-w-6xl px-4 md:px-6">
        <p className="text-xs text-muted-foreground">
          © 2025 BRL Ltda. — Build Run Lead.
        </p>
      </div>
    </footer>
  );
}
