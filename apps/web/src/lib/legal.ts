/**
 * Conteúdo das páginas legais (Termos de Uso e Política de Privacidade).
 * Texto-base em PT-BR — placeholder coerente pra produção, mas que ainda
 * pede revisão jurídica antes do go-live de verdade.
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  title: string;
  /** Data da última atualização, já formatada. */
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

const UPDATED_AT = "26 de junho de 2026";

export const TERMS: LegalDoc = {
  title: "Termos de Uso",
  updatedAt: UPDATED_AT,
  intro:
    "Estes Termos regem o uso dos produtos da BRL Health — incluindo o BRL Nutri e o BRL Fit. Ao criar uma conta ou usar nossos serviços, você concorda com tudo o que está descrito aqui.",
  sections: [
    {
      heading: "1. Aceitação dos termos",
      paragraphs: [
        "Ao acessar ou usar a plataforma da BRL Health, você declara que leu, entendeu e concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se não concordar com qualquer ponto, não utilize os serviços.",
      ],
    },
    {
      heading: "2. Definições",
      bullets: [
        "“Plataforma” — os sites, aplicativos e serviços oferecidos pela BRL Health.",
        "“BRL Nutri” — o produto de planejamento alimentar e acompanhamento nutricional.",
        "“BRL Fit” — o produto de treino, ainda em desenvolvimento.",
        "“Usuário” — qualquer pessoa que acessa ou usa a Plataforma.",
      ],
    },
    {
      heading: "3. Cadastro e conta",
      paragraphs: [
        "Para usar os recursos personalizados, você precisa criar uma conta com informações verdadeiras e mantê-las atualizadas. Você é responsável por manter a confidencialidade das suas credenciais e por toda atividade realizada na sua conta.",
        "É necessário ter pelo menos 18 anos, ou estar acompanhado por um responsável legal, para criar uma conta.",
      ],
    },
    {
      heading: "4. Uso da plataforma",
      paragraphs: [
        "Você concorda em usar a Plataforma apenas para fins lícitos e de acordo com estes Termos. É proibido tentar burlar mecanismos de segurança, fazer engenharia reversa, sobrecarregar a infraestrutura ou usar os serviços para prejudicar terceiros.",
      ],
    },
    {
      heading: "5. Orientações de saúde — leia com atenção",
      paragraphs: [
        "O BRL Nutri gera planos alimentares e estimativas (calorias, macros, hidratação) com base nos dados que você informa. Esse conteúdo tem caráter informativo e educacional e não substitui a avaliação de um médico, nutricionista ou outro profissional de saúde habilitado.",
        "Antes de iniciar qualquer dieta ou programa de exercícios, especialmente em caso de condições preexistentes, gestação ou uso de medicamentos, consulte um profissional. O uso das informações é de sua responsabilidade.",
      ],
    },
    {
      heading: "6. Planos, assinaturas e pagamentos",
      paragraphs: [
        "Alguns recursos dependem de planos pagos. Os preços, benefícios e periodicidade são apresentados no momento da contratação. A cobrança é recorrente conforme o plano escolhido, até que você cancele.",
        "Você pode cancelar a qualquer momento; o acesso aos recursos pagos permanece até o fim do ciclo já pago. Salvo disposição legal em contrário, valores já cobrados não são reembolsados proporcionalmente.",
      ],
    },
    {
      heading: "7. Propriedade intelectual",
      paragraphs: [
        "Marca, logotipo, textos, design, código e demais materiais da Plataforma pertencem à BRL Health ou a seus licenciadores. O acesso ao serviço não transfere nenhum desses direitos a você.",
      ],
    },
    {
      heading: "8. Limitação de responsabilidade",
      paragraphs: [
        "A Plataforma é fornecida “como está”. Na máxima extensão permitida pela lei, a BRL Health não se responsabiliza por danos indiretos, perda de dados ou resultados específicos de saúde decorrentes do uso dos serviços.",
      ],
    },
    {
      heading: "9. Rescisão",
      paragraphs: [
        "Você pode encerrar sua conta quando quiser. Podemos suspender ou encerrar contas que violem estes Termos ou a legislação aplicável, mediante aviso quando cabível.",
      ],
    },
    {
      heading: "10. Alterações nos termos",
      paragraphs: [
        "Podemos atualizar estes Termos periodicamente. Mudanças relevantes serão comunicadas pelos nossos canais. O uso continuado após a atualização significa concordância com a nova versão.",
      ],
    },
    {
      heading: "11. Lei aplicável e foro",
      paragraphs: [
        "Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do consumidor para dirimir eventuais conflitos.",
      ],
    },
    {
      heading: "12. Contato",
      paragraphs: [
        "Dúvidas sobre estes Termos? Fale com a gente pela página de contato ou pelo e-mail juridico@brlhealth.com.br.",
      ],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  title: "Política de Privacidade",
  updatedAt: UPDATED_AT,
  intro:
    "Esta Política explica como a BRL Health coleta, usa, compartilha e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).",
  sections: [
    {
      heading: "1. Quem é o controlador",
      paragraphs: [
        "A BRL Health é a controladora dos dados pessoais tratados na Plataforma. Isso significa que somos responsáveis por decidir como e por que seus dados são tratados.",
      ],
    },
    {
      heading: "2. Dados que coletamos",
      bullets: [
        "Dados de cadastro: nome, e-mail e senha (armazenada de forma cifrada).",
        "Dados do perfil nutricional: sexo, idade, altura, peso, objetivo, nível de atividade, dieta e restrições.",
        "Dados de acompanhamento: água, peso, hábitos, refeições, medidas, sono e passos que você registra.",
        "Dados de pagamento: processados por parceiros; não armazenamos os números completos do seu cartão.",
        "Dados de uso: informações técnicas de navegação para segurança e melhoria do serviço.",
      ],
    },
    {
      heading: "3. Como usamos seus dados",
      bullets: [
        "Gerar e ajustar seu plano alimentar personalizado.",
        "Manter sua conta, autenticação e histórico de acompanhamento.",
        "Processar assinaturas e pagamentos.",
        "Comunicar novidades, suporte e avisos importantes.",
        "Cumprir obrigações legais e prevenir fraudes.",
      ],
    },
    {
      heading: "4. Base legal do tratamento",
      paragraphs: [
        "Tratamos seus dados com base na execução do contrato (para entregar o serviço), no consentimento (quando aplicável, como comunicações de marketing), no cumprimento de obrigação legal e no legítimo interesse para segurança e melhoria da Plataforma.",
      ],
    },
    {
      heading: "5. Compartilhamento",
      paragraphs: [
        "Não vendemos seus dados. Compartilhamos apenas o necessário com operadores que nos ajudam a prestar o serviço — como provedores de pagamento, e-mail e hospedagem — sempre sob obrigações de confidencialidade, ou quando exigido por lei.",
      ],
    },
    {
      heading: "6. Armazenamento e segurança",
      paragraphs: [
        "Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração. Nenhum sistema é 100% infalível, mas trabalhamos continuamente para reduzir riscos.",
      ],
    },
    {
      heading: "7. Cookies",
      paragraphs: [
        "Usamos cookies e tecnologias semelhantes para manter sua sessão, lembrar preferências e entender o uso da Plataforma. Você pode gerenciar cookies nas configurações do seu navegador.",
      ],
    },
    {
      heading: "8. Seus direitos (LGPD)",
      bullets: [
        "Confirmar a existência de tratamento e acessar seus dados.",
        "Corrigir dados incompletos, inexatos ou desatualizados.",
        "Solicitar anonimização, bloqueio ou eliminação de dados desnecessários.",
        "Solicitar a portabilidade dos dados.",
        "Revogar o consentimento e solicitar a exclusão da conta.",
      ],
    },
    {
      heading: "9. Retenção de dados",
      paragraphs: [
        "Mantemos seus dados pelo tempo necessário para prestar o serviço e cumprir obrigações legais. Após esse período, os dados são eliminados ou anonimizados.",
      ],
    },
    {
      heading: "10. Menores de idade",
      paragraphs: [
        "A Plataforma é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de menores sem o consentimento de seus responsáveis legais.",
      ],
    },
    {
      heading: "11. Alterações nesta política",
      paragraphs: [
        "Podemos atualizar esta Política para refletir mudanças no serviço ou na legislação. Avisaremos sobre alterações relevantes pelos nossos canais.",
      ],
    },
    {
      heading: "12. Encarregado e contato",
      paragraphs: [
        "Para exercer seus direitos ou tirar dúvidas sobre privacidade, fale com nosso Encarregado pelo e-mail privacidade@brlhealth.com.br ou pela página de contato.",
      ],
    },
  ],
};
