import { describe, expect, it } from "vitest";
import { initialReferenceLabel, referenceId, referenceOptionLabel } from "./referenceUtils";

describe("referenceUtils", () => {
  it("resolve id tanto por _id quanto por id", () => {
    expect(referenceId({ _id: "mongo-id" })).toBe("mongo-id");
    expect(referenceId({ id: 42 })).toBe("42");
  });

  it("resolve rótulo inicial de referência populada", () => {
    expect(initialReferenceLabel({ _id: "1", nome: "Fornecedor XPTO" })).toBe(
      "Fornecedor XPTO"
    );
    expect(initialReferenceLabel("1")).toBe("");
  });

  it("remove valores repetidos do rótulo", () => {
    expect(referenceOptionLabel({ nome: "Produto A", descricao: "Produto A", codigo: "A-1" })).toBe(
      "Produto A — A-1"
    );
  });
});
