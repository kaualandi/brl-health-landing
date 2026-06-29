# Segurança no Ciclo de Desenvolvimento — BRL Health (AV2)

> Cobre o item **19**: (a) Threat Model da rota de maior risco e (b) os Gates de
> segurança adotados pela equipe.

---

## (a) Threat Model — rota de maior risco

> Rota analisada: `POST /auth/login` — porta de entrada da conta e, por tabela,
> de todos os dados de saúde do usuário. É a rota de maior risco do sistema.

Ativos Protegidos: credenciais dos usuários (e-mail/senha), o token de sessão e,
por extensão, os dados pessoais e de saúde do BRL Nutri (perfil, peso, medidas,
histórico) acessíveis após o login.

Vetor de Ataque Provável: ataque de força bruta / credential stuffing contra o
endpoint de login (tentativas automatizadas em massa) e interceptação de
credenciais em trânsito.

Falha Arquitetural Potencial: ausência de rate-limit e de bloqueio progressivo
(dívida DT-02), mensagens de erro que distinguem "e-mail inexistente" de "senha
errada" (enumeração de usuários) e armazenamento de senha sem hash forte.

Controle de Engenharia (Mitigação): rate-limiting + bloqueio temporário após N
tentativas, hash de senha com algoritmo lento (BCrypt/Argon2), mensagem de erro
genérica ("credenciais inválidas"), HTTPS obrigatório e log de tentativas
suspeitas para a matriz de riscos.

---

## (b) Gates de Segurança

> Três portões obrigatórios no pipeline; nenhuma mudança chega à produção sem
> passar por todos.

Gate 1 — Análise estática e de segredos (pré-merge): o CI roda lint, build e um
scanner de segredos. Bloqueia o merge se encontrar credencial hardcoded em
`/backend/src/**.cs` (`Password=`, `Pwd=`, `User Id=`, `ConnectionString=`) ou
SQL por concatenação. Alinha-se ao item 18 (SSDF) da AV2.

Gate 2 — Testes e cobertura (pré-merge): a suíte de testes (incluindo os testes
AAA das regras de negócio) precisa passar 100% e manter a cobertura mínima
acordada das camadas de regra (`Services`/`Validation`). Falha = merge bloqueado.

Gate 3 — Revisão de segurança e aprovação (pré-release): pelo menos um revisor
valida autenticação/autorização, parametrização das queries e tratamento de dados
sensíveis (LGPD) antes do deploy em produção, com checklist de Threat Model
revisado para rotas novas de risco.
