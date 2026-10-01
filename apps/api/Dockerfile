FROM oven/bun:1.3-alpine
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN bun install --frozen-lockfile --filter api
COPY apps/api apps/api
WORKDIR /app/apps/api
EXPOSE 3333
CMD ["sh", "-c", "bun run db:migrate && bun run db:seed && bun run start"]
