import { describe, it, expect } from "vitest";
import type { AxiosInstance } from "axios";
import { normalizeError } from "../src/api/errorNormalizer";
import { createResourceClient } from "../src/api/resourceClient";
import { columnsFromMeta, formFieldsFromMeta, formatCell } from "../src/components/internal/fieldUtils";
import type { FieldMeta } from "../src/types";

/* errorNormalizer ------------------------------------------------------ */

describe("normalizeError", () => {
  it("lê o envelope { error } do back", () => {
    const err = {
      isAxiosError: true,
      message: "Request failed",
      response: { status: 400, data: { error: { code: "VALIDATION_ERROR", message: "Campos inválidos" } }, headers: {} },
    };
    // simula axios.isAxiosError reconhecendo a flag
    const normalized = normalizeError(Object.assign(new Error("x"), err));
    expect(normalized.message).toBeTruthy();
  });

  it("normaliza Error comum", () => {
    const n = normalizeError(new Error("boom"));
    expect(n).toEqual({ code: "UNKNOWN", message: "boom" });
  });
});

/* resourceClient ------------------------------------------------------- */

function fakeHttp(): { http: AxiosInstance; calls: Array<{ method: string; url: string; body?: unknown }> } {
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];
  const http = {
    get: async (url: string) => {
      calls.push({ method: "GET", url });
      if (url.endsWith("/123")) return { data: { pessoa: { _id: "123", nome: "Ana" } } };
      return { data: { results: [{ _id: "1" }], pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 20 } } };
    },
    post: async (url: string, body: unknown) => {
      calls.push({ method: "POST", url, body });
      return { data: { pessoa: { _id: "novo", ...(body as object) } } };
    },
  } as unknown as AxiosInstance;
  return { http, calls };
}

describe("resourceClient", () => {
  it("monta a URL do recurso e desembrulha o singular", async () => {
    const { http, calls } = fakeHttp();
    const client = createResourceClient(http, "/pessoas");

    const list = await client.list({ pageIndex: 0 });
    expect(list.pagination.totalItems).toBe(1);
    expect(calls[0].url).toBe("/pessoas");

    const one = await client.get("123");
    expect(one).toEqual({ _id: "123", nome: "Ana" });

    const created = await client.create({ nome: "Bia" });
    expect((created as { nome: string }).nome).toBe("Bia");
    expect(calls.at(-1)?.url).toBe("/pessoas");
  });
});

/* fieldUtils ----------------------------------------------------------- */

const fields: FieldMeta[] = [
  { name: "nome", kind: "string", label: "Nome" },
  { name: "status", kind: "enum", options: ["ativo", "inativo"] },
  { name: "_id", kind: "raw" },
];

describe("fieldUtils", () => {
  it("deriva colunas e form da metadata, ignorando campos ocultos/raw", () => {
    const cols = columnsFromMeta(fields);
    expect(cols.map((c) => c.field)).toEqual(["nome", "status"]);

    const form = formFieldsFromMeta(fields);
    expect(form.find((f) => f.field === "status")?.options).toEqual(["ativo", "inativo"]);
  });

  it("formata célula por tipo", () => {
    expect(formatCell(true, "boolean")).toBe("Sim");
    expect(formatCell(1500, "currency")).toContain("1.500");
    expect(formatCell(null, "string")).toBe("—");
    expect(formatCell({ nome: "Ana" }, "ref")).toBe("Ana");
  });
});
