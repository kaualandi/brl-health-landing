import { describe, expect, it } from "bun:test";
import { api } from "../test/http";
import { signup } from "../test/users";
import { scheduleErrors, type ScheduleContext } from "./consultations.rules";

const MONDAY = "2030-01-07";
const SUNDAY = "2030-01-06";
/** Segunda–sábado aleatório no futuro (banco persistente entre execuções). */
const day = () => {
  const d = new Date(Date.UTC(2030, 0, 7 + Math.floor(Math.random() * 3000)));
  if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const ok: ScheduleContext = {
  nutritionistId: "ana-prado",
  date: MONDAY,
  time: "08:00",
  today: "2026-01-01",
  activeCount: 0,
  credits: 1,
  slotTaken: false,
};
const book = (token: string, body: object) => api("POST", "/consultations", body, token);

describe("regras puras", () => {
  it("válido não tem erros", () => expect(scheduleErrors(ok)).toEqual([]));
  it("cada regra isolada", () => {
    expect(scheduleErrors({ ...ok, activeCount: 1 })).toEqual(["Sem saldo de consultas no seu plano."]);
    expect(scheduleErrors({ ...ok, slotTaken: true })).toEqual(["Horário já ocupado para este nutricionista."]);
    expect(scheduleErrors({ ...ok, date: SUNDAY })).toEqual(["Não há atendimento aos domingos."]);
    expect(scheduleErrors({ ...ok, time: "13:00" })).toEqual(["Horário fora da agenda do profissional."]);
    expect(scheduleErrors({ ...ok, nutritionistId: "x" })).toEqual(["Horário fora da agenda do profissional."]);
    expect(scheduleErrors({ ...ok, today: "2030-02-01" })).toEqual(["A data não pode estar no passado."]);
  });
  it("combina todas as violações", () => {
    expect(scheduleErrors({ ...ok, activeCount: 1, slotTaken: true, date: SUNDAY, time: "13:00", today: "2031-01-01" })).toHaveLength(5);
  });
});

describe("rotas", () => {
  it("401 sem token", async () => {
    expect((await api("GET", "/consultations/me")).status).toBe(401);
    expect((await api("POST", "/consultations", { nutritionistId: "ana-prado", date: MONDAY, time: "08:00" })).status).toBe(401);
    expect((await api("DELETE", "/consultations/1")).status).toBe(401);
  });

  it("agenda e lista com JOIN", async () => {
    const D = day();
    const s = await signup();
    const res = await book(s.token, { nutritionistId: "bianca-rios", date: D, time: "09:00" });
    expect(res.status).toBe(201);
    const list = await api("GET", "/consultations/me", undefined, s.token);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({
      id: res.body.id,
      nutritionistId: "bianca-rios",
      date: D,
      time: "09:00",
      userName: "Teste",
    });
    expect(list.body[0].nutritionistName).toBeString();
    expect(list.body[0].crn).toBeString();
    expect(list.body[0].nutritionistFocus).toBeString();
  });

  it("formato inválido -> 400", async () => {
    const s = await signup();
    expect((await book(s.token, { nutritionistId: "ana-prado", date: "07/01/2030", time: "08:00" })).status).toBe(400);
    expect((await book(s.token, { nutritionistId: "ana-prado", date: "2030-02-31", time: "08:00" })).status).toBe(400);
  });

  it("sem saldo no free", async () => {
    const D = day();
    const s = await signup();
    await book(s.token, { nutritionistId: "diego-martins", date: D, time: "08:30" });
    const res = await book(s.token, { nutritionistId: "diego-martins", date: D, time: "11:30" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(["Sem saldo de consultas no seu plano."]);
  });

  it("slot ocupado por outro usuário", async () => {
    const D = day();
    const [a, b] = [await signup(), await signup()];
    const body = { nutritionistId: "rafael-couto", date: D, time: "07:00" };
    expect((await book(a.token, body)).status).toBe(201);
    const res = await book(b.token, body);
    expect(res.body.errors).toEqual(["Horário já ocupado para este nutricionista."]);
  });

  it("domingo, fora da agenda e passado", async () => {
    const D = day();
    const s = await signup();
    const sun = await book(s.token, { nutritionistId: "ana-prado", date: SUNDAY, time: "08:00" });
    expect(sun.body.errors).toEqual(["Não há atendimento aos domingos."]);
    const off = await book(s.token, { nutritionistId: "ana-prado", date: D, time: "13:00" });
    expect(off.body.errors).toEqual(["Horário fora da agenda do profissional."]);
    const past = await book(s.token, { nutritionistId: "ana-prado", date: "2020-01-07", time: "08:00" });
    expect(past.body.errors).toEqual(["A data não pode estar no passado."]);
  });

  it("cancelar devolve o saldo", async () => {
    const D = day();
    const s = await signup();
    const first = await book(s.token, { nutritionistId: "ana-prado", date: D, time: "14:00" });
    const del = await api("DELETE", `/consultations/${first.body.id}`, undefined, s.token);
    expect(del.status).toBe(204);
    expect((await api("GET", "/consultations/me", undefined, s.token)).body).toEqual([]);
    expect((await book(s.token, { nutritionistId: "ana-prado", date: D, time: "15:00" })).status).toBe(201);
    expect((await api("DELETE", `/consultations/${first.body.id}`, undefined, s.token)).status).toBe(404);
  });

  it("DELETE de outro usuário -> 404", async () => {
    const D = day();
    const [a, b] = [await signup(), await signup()];
    const c = await book(a.token, { nutritionistId: "bianca-rios", date: D, time: "16:00" });
    const res = await api("DELETE", `/consultations/${c.body.id}`, undefined, b.token);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Consulta não encontrada" });
  });
});
