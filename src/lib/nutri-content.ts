import type { DietStyle, Goal } from "@/types";

/** Um bloco do corpo do artigo. `heading` opcional, parágrafos e/ou bullets. */
export type ArticleSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type Article = {
  id: string;
  category: string;
  emoji: string;
  title: string;
  excerpt: string;
  readTime: string;
  author: string;
  /** Objetivos pra quem o conteúdo é mais relevante (vazio = todos). */
  goals?: Goal[];
  /** Corpo do artigo, em seções. */
  body: ArticleSection[];
};

export const ARTICLES: Article[] = [
  {
    id: "proteina-quanto",
    category: "Macros",
    emoji: "🍗",
    title: "Proteína: quanto você realmente precisa por dia",
    excerpt:
      "Esqueça os mitos. A conta é mais simples — e mais alta — do que te contaram.",
    readTime: "4 min",
    author: "Equipe BRL Nutri",
    goals: ["gain", "recomp", "lose"],
    body: [
      {
        paragraphs: [
          "Proteína é o macronutriente mais subestimado de quem treina. Ela não só constrói músculo: também é o que mais sacia, o que mais protege sua massa magra num déficit e o que tem o maior gasto de energia pra ser digerido.",
        ],
      },
      {
        heading: "A conta que funciona",
        paragraphs: [
          "Pra maioria das pessoas ativas, a faixa que a literatura sustenta é de 1,6 a 2,2 g de proteína por quilo de peso corporal por dia. Quanto mais agressivo o objetivo (cutting puxado ou ganho de massa sério), mais perto do teto.",
        ],
        bullets: [
          "Emagrecendo: 2,0 g/kg — segura a massa magra enquanto a gordura sai.",
          "Recomposição: ~1,9 g/kg — o ponto doce pra trocar gordura por músculo.",
          "Ganhando massa: 1,8 g/kg já cobre, o resto é caloria e treino.",
        ],
      },
      {
        heading: "Como bater na prática",
        paragraphs: [
          "Distribua entre 3 e 5 refeições, com 25–40 g de proteína em cada. Comece o prato pela proteína: frango, ovos, peixe, carne, iogurte, tofu ou leguminosas. O resto se encaixa em volta.",
          "O BRL Nutri já calcula sua meta exata de proteína a partir do seu peso e objetivo — é só seguir o número do seu plano.",
        ],
      },
    ],
  },
  {
    id: "lanches-pre-treino",
    category: "Treino",
    emoji: "🍌",
    title: "5 lanches pré-treino que cabem na rotina (e no bolso)",
    excerpt:
      "Energia rápida sem peso no estômago. Da banana com pasta de amendoim ao iogurte.",
    readTime: "3 min",
    author: "Equipe BRL Nutri",
    goals: ["performance", "gain"],
    body: [
      {
        paragraphs: [
          "O pré-treino certo não precisa ser caro nem complicado. O objetivo é simples: carboidrato de fácil digestão pra ter energia, sem encher o estômago a ponto de atrapalhar o movimento.",
        ],
      },
      {
        heading: "As opções",
        bullets: [
          "Banana com uma colher de pasta de amendoim — clássico por um motivo.",
          "Iogurte natural com aveia e mel.",
          "Pão integral com ovo mexido, se tiver 40+ minutos antes.",
          "Um punhado de tâmaras com castanhas pra treino mais curto.",
          "Vitamina de banana com leite (ou bebida vegetal) e uma scoop de whey.",
        ],
      },
      {
        heading: "Timing",
        paragraphs: [
          "Refeição maior: 1h30 a 2h antes. Lanche leve: 30 a 45 minutos antes. Se você treina em jejum e se sente bem, ótimo — só garanta o resto das calorias e proteínas ao longo do dia.",
        ],
      },
    ],
  },
  {
    id: "ler-rotulos",
    category: "Hábitos",
    emoji: "🔎",
    title: "Como ler rótulos sem cair em pegadinha de marketing",
    excerpt:
      "‘Zero açúcar’ nem sempre é o que parece. Aprenda a olhar a tabela do jeito certo.",
    readTime: "5 min",
    author: "Equipe BRL Nutri",
    body: [
      {
        paragraphs: [
          "A frente da embalagem é publicidade. A verdade está atrás, na tabela nutricional e na lista de ingredientes. Aprender a ler os dois te livra de 90% das pegadinhas.",
        ],
      },
      {
        heading: "Olhe a porção, não o pacote",
        paragraphs: [
          "Fabricantes adoram porções minúsculas pra fazer os números parecerem baixos. Confira quantas gramas é a porção declarada e compare com o quanto você realmente come.",
        ],
      },
      {
        heading: "A lista de ingredientes não mente",
        paragraphs: [
          "Os ingredientes vêm em ordem de quantidade. Se açúcar (ou seus apelidos: xarope de glicose, maltodextrina, dextrose) aparece nos primeiros, desconfie do ‘fit’ no rótulo.",
        ],
        bullets: [
          "‘Zero açúcar’ pode ter adoçante e ainda assim muita gordura/caloria.",
          "‘Integral’ de verdade traz farinha integral como primeiro ingrediente.",
          "‘Light’ só significa 25% menos de algo — não necessariamente saudável.",
        ],
      },
    ],
  },
  {
    id: "deficit-sem-fome",
    category: "Emagrecimento",
    emoji: "🥗",
    title: "Déficit calórico sem passar fome: o guia honesto",
    excerpt:
      "Volume, fibra e proteína são seus amigos. Veja como montar pratos que saciam.",
    readTime: "6 min",
    author: "Equipe BRL Nutri",
    goals: ["lose", "recomp"],
    body: [
      {
        paragraphs: [
          "Emagrecer exige déficit calórico — comer menos do que gasta. Mas déficit não precisa ser sinônimo de fome. O truque é escolher alimentos que entregam muito volume e saciedade por poucas calorias.",
        ],
      },
      {
        heading: "Os pilares da saciedade",
        bullets: [
          "Proteína em toda refeição — é o macro que mais corta a fome.",
          "Vegetais e folhas à vontade — enchem o prato com pouquíssimas calorias.",
          "Fibra (aveia, leguminosas, frutas com casca) — digestão mais lenta, fome adiada.",
          "Água antes das refeições — boa parte da ‘fome’ é sede disfarçada.",
        ],
      },
      {
        heading: "Monte o prato",
        paragraphs: [
          "Metade do prato de vegetais, um quarto de proteína, um quarto de carboidrato de qualidade. Esse formato simples resolve a maioria dos almoços e jantares sem precisar pesar nada.",
          "Um déficit moderado (em torno de 15–20% abaixo do gasto) emagrece de forma sustentável e preserva músculo. É exatamente o ajuste que o BRL Nutri aplica no objetivo de perder gordura.",
        ],
      },
    ],
  },
  {
    id: "agua-hidratacao",
    category: "Hidratação",
    emoji: "💧",
    title: "Você provavelmente bebe menos água do que pensa",
    excerpt:
      "Sinais de desidratação leve que sabotam seu treino e sua fome — e como corrigir.",
    readTime: "3 min",
    author: "Equipe BRL Nutri",
    body: [
      {
        paragraphs: [
          "Desidratação leve raramente dá sede óbvia. Ela aparece disfarçada: queda de energia no treino, dor de cabeça no fim da tarde e aquela ‘fome’ que some depois de um copo d’água.",
        ],
      },
      {
        heading: "Sinais sutis",
        bullets: [
          "Urina amarelo-escura (o ideal é amarelo-clarinho).",
          "Cansaço e dificuldade de concentração à tarde.",
          "Fome fora de hora — sede e fome usam o mesmo sinal cerebral.",
        ],
      },
      {
        heading: "Quanto e como",
        paragraphs: [
          "Uma referência prática é ~35 ml por quilo de peso por dia, mais um extra nos dias de treino. Espalhe ao longo do dia: um copo ao acordar, um antes de cada refeição e uma garrafa por perto. O BRL Nutri calcula sua meta de água e te ajuda a acompanhar.",
        ],
      },
    ],
  },
  {
    id: "fora-de-casa",
    category: "Rotina",
    emoji: "🍔",
    title: "Comendo fora sem sair da meta",
    excerpt:
      "Restaurante, delivery, festa de aniversário. Estratégias pra cada situação real.",
    readTime: "5 min",
    author: "Equipe BRL Nutri",
    body: [
      {
        paragraphs: [
          "Plano que só funciona em casa não é plano, é prisão. A vida real tem restaurante, delivery e aniversário — e dá pra navegar todos sem culpa nem descarrilar.",
        ],
      },
      {
        heading: "No restaurante",
        bullets: [
          "Escolha a proteína primeiro, depois o acompanhamento.",
          "Grelhados, assados e cozidos em vez de fritos e empanados.",
          "Molho e queijo à parte — você controla a quantidade.",
        ],
      },
      {
        heading: "No delivery e nas festas",
        paragraphs: [
          "No delivery, monte o pedido como montaria o prato: uma boa proteína e algo de vegetal. Na festa, coma uma refeição decente antes pra não chegar faminto, aproveite o que vale a pena e volte ao normal na próxima refeição. Um dia não desfaz uma semana.",
        ],
      },
    ],
  },
  {
    id: "carbo-noite",
    category: "Mitos",
    emoji: "🌙",
    title: "Carboidrato à noite engorda? A ciência responde",
    excerpt:
      "Spoiler: o que importa é o total do dia, não o relógio. Entenda o porquê.",
    readTime: "4 min",
    author: "Equipe BRL Nutri",
    body: [
      {
        paragraphs: [
          "O mito é forte: ‘carbo à noite vira gordura’. Mas seu corpo não tem um relógio que liga o modo-engorda às 18h. O que determina ganho ou perda de peso é o balanço calórico do dia inteiro, não o horário.",
        ],
      },
      {
        heading: "De onde veio a confusão",
        paragraphs: [
          "À noite tendemos a comer por tédio, estresse ou sono ruim — e aí o total do dia estoura. O vilão não é o carboidrato no jantar; é a caloria extra que vem junto, geralmente sem fome real.",
        ],
      },
      {
        heading: "O que fazer com isso",
        paragraphs: [
          "Se carboidrato no jantar te ajuda a dormir melhor e a treinar de manhã com energia, mantenha. O importante é fechar o total de calorias e proteínas do dia. Distribuição é preferência pessoal, não regra metabólica.",
        ],
      },
    ],
  },
  {
    id: "proteina-vegetal",
    category: "Plant-based",
    emoji: "🌱",
    title: "Proteína vegetal: como bater a meta sem carne",
    excerpt:
      "Combinações de leguminosas, grãos e tofu que fecham seu aminograma do dia.",
    readTime: "5 min",
    author: "Equipe BRL Nutri",
    body: [
      {
        paragraphs: [
          "Dá pra construir e manter músculo sem carne — só exige um pouco mais de intenção. A chave é variar as fontes ao longo do dia pra cobrir todos os aminoácidos essenciais.",
        ],
      },
      {
        heading: "As melhores fontes",
        bullets: [
          "Soja e derivados (tofu, tempeh, edamame, proteína de soja) — perfil completo.",
          "Leguminosas: feijão, grão-de-bico, lentilha, ervilha.",
          "Grãos integrais e pseudocereais como quinoa.",
          "Suplemento de proteína vegetal pra fechar a meta nos dias corridos.",
        ],
      },
      {
        heading: "Combinar é a estratégia",
        paragraphs: [
          "Leguminosa + grão (arroz com feijão, por exemplo) se complementam e formam um aminograma completo. Você não precisa combinar na mesma refeição — ao longo do dia já resolve.",
          "Mire um pouco mais alto na meta de proteína (a digestibilidade vegetal é levemente menor) e você fica coberto. No BRL Nutri, é só escolher o estilo vegetariano ou vegano no onboarding.",
        ],
      },
    ],
  },
];

/** Busca um artigo pelo id (slug). */
export function getArticle(id: string): Article | undefined {
  return ARTICLES.find((article) => article.id === id);
}

/** Artigos relacionados — mesma categoria primeiro, completando com o resto. */
export function relatedArticles(id: string, count = 3): Article[] {
  const current = getArticle(id);
  if (!current) return ARTICLES.slice(0, count);
  const sameCategory = ARTICLES.filter(
    (a) => a.id !== id && a.category === current.category,
  );
  const rest = ARTICLES.filter(
    (a) => a.id !== id && a.category !== current.category,
  );
  return [...sameCategory, ...rest].slice(0, count);
}

/** Todas as categorias únicas, pra montar filtros. */
export function articleCategories(): string[] {
  return Array.from(new Set(ARTICLES.map((a) => a.category)));
}

export type QuickTip = {
  emoji: string;
  text: string;
};

export const QUICK_TIPS: QuickTip[] = [
  { emoji: "🥤", text: "Comece o dia com um copo de água antes do café." },
  { emoji: "🍽️", text: "Encha metade do prato de vegetais — sacia e tem poucas calorias." },
  { emoji: "🛒", text: "Nunca vá ao mercado com fome. Sua lista agradece." },
  { emoji: "😴", text: "Dormir mal aumenta a fome no dia seguinte. Priorize o sono." },
  { emoji: "🥩", text: "Coloque a proteína no prato primeiro — o resto se ajusta." },
];

export type DailyHabit = {
  id: string;
  emoji: string;
  label: string;
};

export const DAILY_HABITS: DailyHabit[] = [
  { id: "water", emoji: "💧", label: "Bater a meta de água" },
  { id: "protein", emoji: "🍗", label: "Comer proteína em toda refeição" },
  { id: "veggies", emoji: "🥦", label: "Incluir vegetais no almoço e jantar" },
  { id: "move", emoji: "👟", label: "10 mil passos no dia" },
  { id: "sleep", emoji: "😴", label: "7–8 horas de sono" },
];

export type Recipe = {
  title: string;
  emoji: string;
  kcal: number;
  time: string;
  tags: string[];
};

const RECIPES: Record<DietStyle, Recipe> = {
  omnivore: {
    title: "Frango grelhado com batata-doce e brócolis",
    emoji: "🍗",
    kcal: 520,
    time: "25 min",
    tags: ["Alta proteína", "Pós-treino"],
  },
  vegetarian: {
    title: "Omelete de espinafre com queijo e torrada integral",
    emoji: "🍳",
    kcal: 430,
    time: "15 min",
    tags: ["Vegetariano", "Rápido"],
  },
  vegan: {
    title: "Bowl de grão-de-bico, quinoa e tahine",
    emoji: "🥗",
    kcal: 480,
    time: "20 min",
    tags: ["Vegano", "Rico em fibra"],
  },
  lowcarb: {
    title: "Salmão com aspargos no azeite",
    emoji: "🐟",
    kcal: 460,
    time: "20 min",
    tags: ["Low carb", "Ômega-3"],
  },
  mediterranean: {
    title: "Atum com grão-de-bico, tomate e azeitona",
    emoji: "🫒",
    kcal: 470,
    time: "15 min",
    tags: ["Mediterrâneo", "Sem fogão"],
  },
};

export function recipeForDiet(diet: DietStyle): Recipe {
  return RECIPES[diet] ?? RECIPES.omnivore;
}

/** Prioriza artigos relevantes ao objetivo, mas sempre devolve `count` itens. */
export function curatedArticles(goal: Goal, count = 6): Article[] {
  const relevant = ARTICLES.filter((a) => a.goals?.includes(goal));
  const rest = ARTICLES.filter((a) => !relevant.includes(a));
  return [...relevant, ...rest].slice(0, count);
}
