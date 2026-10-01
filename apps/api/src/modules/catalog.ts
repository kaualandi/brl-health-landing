import { asc, eq, getTableColumns } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db, schema } from "../db";

const { articles, foods, nutritionists, recipes } = schema;
const { body, ...articleCols } = getTableColumns(articles);
const idParam = { params: t.Object({ id: t.String() }) };

const toRecipe = ({ prepTime, protein, carbs, fat, ...r }: typeof recipes.$inferSelect) => ({
  ...r,
  time: prepTime,
  macros: { protein, carbs, fat },
});

export const catalogModule = new Elysia()
  .get("/foods", () => db.select().from(foods).orderBy(asc(foods.role), asc(foods.id)))
  .get("/nutritionists", () => db.select().from(nutritionists).orderBy(asc(nutritionists.id)))
  .get("/articles", () => db.select(articleCols).from(articles).orderBy(asc(articles.id)))
  .get(
    "/articles/:id",
    async ({ params, status }) => {
      const [row] = await db.select().from(articles).where(eq(articles.id, params.id));
      return row ?? status(404, { error: "Artigo não encontrado" });
    },
    idParam,
  )
  .get("/recipes", async () => (await db.select().from(recipes).orderBy(asc(recipes.category), asc(recipes.id))).map(toRecipe))
  .get(
    "/recipes/:id",
    async ({ params, status }) => {
      const [row] = await db.select().from(recipes).where(eq(recipes.id, params.id));
      return row ? toRecipe(row) : status(404, { error: "Receita não encontrada" });
    },
    idParam,
  );
