import { describe, expect, it } from "vitest";
import type { FieldMeta } from "../../types";
import { formFieldsFromMeta } from "./fieldUtils";
import { referenceOptionLabel } from "./referenceUtils";

describe("formFieldsFromMeta", () => {
  it("propaga o modelo relacionado e a obrigatoriedade", () => {
    const fields: FieldMeta[] = [
      {
        name: "fornecedor",
        kind: "ref",
        ref: "Pessoa",
        label: "Fornecedor",
        required: true,
      },
    ];

    expect(formFieldsFromMeta(fields)).toEqual([
      {
        field: "fornecedor",
        label: "Fornecedor",
        kind: "ref",
        required: true,
        options: undefined,
        ref: "Pessoa",
      },
    ]);
  });
});

describe("referenceOptionLabel", () => {
  it("combina código e descrição quando disponíveis", () => {
    expect(
      referenceOptionLabel({
        _id: "1",
        codigo: "PROD-001",
        descricao: "Placa de aço",
      })
    ).toBe("Placa de aço — PROD-001");
  });

  it("usa campos pesquisáveis e recorre ao id", () => {
    expect(referenceOptionLabel({ _id: "1", titulo: "Pedido especial" }, ["titulo"])).toBe(
      "Pedido especial"
    );
    expect(referenceOptionLabel({ _id: "abc" })).toBe("abc");
  });
});
