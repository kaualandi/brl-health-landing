import {
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, ReactNode, SVGProps } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BrandIconProps = SVGProps<SVGSVGElement>;

function InstagramMark(props: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23a3.72 3.72 0 0 1-.9 1.38 3.72 3.72 0 0 1-1.38.9c-.42.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.42 2.21 8.8 2.2 12 2.2Zm0 2.16c-3.15 0-3.5.01-4.74.07-1.07.05-1.65.23-2.04.38-.51.2-.88.44-1.26.82a3.4 3.4 0 0 0-.82 1.26c-.15.39-.33.97-.38 2.04-.06 1.24-.07 1.59-.07 4.74s.01 3.5.07 4.74c.05 1.07.23 1.65.38 2.04.2.51.44.88.82 1.26.38.38.75.62 1.26.82.39.15.97.33 2.04.38 1.24.06 1.59.07 4.74.07s3.5-.01 4.74-.07c1.07-.05 1.65-.23 2.04-.38.51-.2.88-.44 1.26-.82.38-.38.62-.75.82-1.26.15-.39.33-.97.38-2.04.06-1.24.07-1.59.07-4.74s-.01-3.5-.07-4.74c-.05-1.07-.23-1.65-.38-2.04a3.4 3.4 0 0 0-.82-1.26 3.4 3.4 0 0 0-1.26-.82c-.39-.15-.97-.33-2.04-.38-1.24-.06-1.59-.07-4.74-.07Zm0 3.68a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 6.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Zm5.1-6.76a.94.94 0 1 1-1.88 0 .94.94 0 0 1 1.88 0Z" />
    </svg>
  );
}

function LinkedinMark(props: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.28 2.37 4.28 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

function GithubMark(props: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.74-1.55-2.56-.29-5.26-1.28-5.26-5.69 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.48.11-3.08 0 0 .97-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.4c.99 0 1.98.13 2.92.4 2.22-1.49 3.2-1.18 3.2-1.18.63 1.6.23 2.78.11 3.08.75.81 1.2 1.84 1.2 3.1 0 4.42-2.7 5.39-5.27 5.67.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

type InfoCardProps = {
  Icon: LucideIcon;
  iconClassName: string;
  borderClassName: string;
  title: string;
  children: ReactNode;
};

function InfoCard({
  Icon,
  iconClassName,
  borderClassName,
  title,
  children,
}: InfoCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-foreground/5 border-l-4 bg-brl-card p-6",
        borderClassName,
      )}
    >
      <Icon aria-hidden className={cn("size-6", iconClassName)} />
      <h3 className="mt-4 font-display text-lg font-extrabold tracking-tight text-foreground">
        {title}
      </h3>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </article>
  );
}

type SocialLink = {
  href: string;
  label: string;
  Icon: ComponentType<BrandIconProps>;
};

// TODO: atualizar links reais antes do lançamento
const socials: SocialLink[] = [
  {
    href: "https://instagram.com/brlhealth",
    label: "Instagram da BRL Health",
    Icon: InstagramMark,
  },
  {
    href: "https://linkedin.com/company/brlhealth",
    label: "LinkedIn da BRL Health",
    Icon: LinkedinMark,
  },
  {
    href: "https://github.com/brlhealth",
    label: "GitHub da BRL Health",
    Icon: GithubMark,
  },
];

export function ContactInfo() {
  return (
    <div className="flex flex-col gap-5">
      <InfoCard
        Icon={MessageCircleIcon}
        iconClassName="text-emerald-400"
        borderClassName="border-l-brl-green"
        title="WhatsApp"
      >
        <p>Resposta rápida, sem robô.</p>
        <Button
          size="lg"
          nativeButton={false}
          className="mt-4 h-11 bg-brl-green px-5 text-sm text-white hover:bg-brl-green/90"
          render={
            <a
              href="https://wa.me/5521999999999"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir conversa no WhatsApp"
            >
              <MessageCircleIcon aria-hidden />
              Chamar no WhatsApp
            </a>
          }
        />
      </InfoCard>

      <InfoCard
        Icon={MailIcon}
        iconClassName="text-brl-purple"
        borderClassName="border-l-brl-purple"
        title="E-mail"
      >
        <p className="text-foreground">contato@brlhealth.com.br</p>
        <p className="mt-1 text-xs text-brl-muted">Respondemos em até 24h.</p>
      </InfoCard>

      <InfoCard
        Icon={MapPinIcon}
        iconClassName="text-brl-orange"
        borderClassName="border-l-brl-orange"
        title="Onde estamos"
      >
        <p className="text-foreground">Rio de Janeiro, RJ — Brasil</p>
        <p className="mt-1 text-xs text-brl-muted">Startup 100% digital.</p>
      </InfoCard>

      <div className="mt-2">
        <p className="text-xs font-medium tracking-wide text-brl-muted uppercase">
          Redes sociais
        </p>
        <ul className="mt-3 flex items-center gap-3">
          {socials.map(({ href, label, Icon }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex size-10 items-center justify-center rounded-lg border border-foreground/10 bg-brl-card text-muted-foreground transition-colors outline-none hover:border-brl-purple hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Icon aria-hidden className="size-5" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
