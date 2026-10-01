/**
 * Conteúdo do /faq. Respostas voltadas pro usuário final — nada de detalhe de
 * implementação (mock/localStorage). Agrupado por tema.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  title: string;
  items: FaqItem[];
}

export const FAQ: FaqCategory[] = [
  {
    title: "Geral",
    items: [
      {
        q: "O que é a BRL Health?",
        a: "É um ecossistema que junta treino e nutrição que se conversam: o BRL Nutri cuida da sua alimentação e o BRL Fit, do seu treino. A ideia é o que você come e como você treina andarem no mesmo ritmo.",
      },
      {
        q: "Preciso pagar pra começar?",
        a: "Não. O plano Free é grátis e já monta seu cardápio personalizado, sem cartão. Você só assina um plano pago se quiser recursos extras.",
      },
      {
        q: "O BRL Fit já está disponível?",
        a: "Ainda não — está chegando. Você pode entrar na lista de espera na página do BRL Fit pra ser avisado no lançamento.",
      },
    ],
  },
  {
    title: "BRL Nutri",
    items: [
      {
        q: "Como o BRL Nutri monta meu plano?",
        a: "A partir do seu perfil — objetivo, peso, altura, nível de atividade, estilo de dieta e restrições — ele calcula suas calorias e macros, sua meta de água e distribui as refeições ao longo do dia.",
      },
      {
        q: "Isso substitui um nutricionista?",
        a: "Não. O conteúdo é informativo e educacional. Pra um acompanhamento profissional, dá pra agendar uma consulta por vídeo com um nutricionista de verdade dentro do app.",
      },
      {
        q: "Posso trocar os alimentos do cardápio?",
        a: "Pode. Cada alimento tem alternativas compatíveis com a sua dieta e restrições — é só tocar pra substituir.",
      },
      {
        q: "Dá pra acompanhar minha evolução?",
        a: "Sim. Você registra água, peso, medidas corporais, sono, passos e hábitos, e acompanha a evolução ao longo do tempo.",
      },
    ],
  },
  {
    title: "Planos e cobrança",
    items: [
      {
        q: "Quais são os planos?",
        a: "Free (grátis), BRL Pro (R$ 29,90/mês) com Fit e Nutri integrados e IA, e BRL Family (R$ 49,90/mês) pra até 4 pessoas com dashboard familiar.",
      },
      {
        q: "Consigo trocar de plano ou cancelar?",
        a: "Sim, quando quiser. Em Minha conta você faz upgrade, muda de plano, faz downgrade ou cancela a assinatura — sem precisar falar com ninguém.",
      },
      {
        q: "Como funciona a cobrança?",
        a: "Os planos pagos são cobrados de forma recorrente no cartão, conforme a periodicidade escolhida. Você pode cancelar a qualquer momento e mantém o acesso até o fim do ciclo já pago.",
      },
    ],
  },
  {
    title: "Conta e privacidade",
    items: [
      {
        q: "Como meus dados são tratados?",
        a: "Com cuidado e em conformidade com a LGPD. Você controla seus dados e pode acessá-los, corrigi-los ou excluí-los. Os detalhes estão na nossa Política de Privacidade.",
      },
      {
        q: "Posso excluir minha conta?",
        a: "Sim. Em Minha conta há a opção de excluir a conta e os dados associados a ela.",
      },
      {
        q: "Ainda tenho uma dúvida que não está aqui.",
        a: "Sem problema — fale com a gente pela página de contato que respondemos por e-mail.",
      },
    ],
  },
];
