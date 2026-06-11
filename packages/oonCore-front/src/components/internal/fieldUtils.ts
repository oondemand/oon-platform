import type { FieldKind, FieldMeta, OonColumnDef, OonFormFieldDef } from "../../types";

/** Campos que normalmente não fazem sentido em grid/form de CRUD. */
const HIDDEN_FIELDS = new Set(["__v", "_id", "createdAt", "updatedAt", "criadoEm", "atualizadoEm"]);

export function isEditableField(meta: FieldMeta): boolean {
  return !HIDDEN_FIELDS.has(meta.name) && meta.kind !== "raw";
}

export function fieldLabel(meta: { name: string; label?: string }): string {
  if (meta.label) return meta.label;
  // humaniza: camelCase/snake_case -> "Camel Case".
  return meta.name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/** Deriva colunas de grid a partir da metadata da model (modo dynamic/minimal). */
export function columnsFromMeta(fields: FieldMeta[]): OonColumnDef[] {
  return fields
    .filter(isEditableField)
    .slice(0, 8)
    .map((f) => ({ field: f.name, label: fieldLabel(f), kind: f.kind, sortable: true }));
}

/** Deriva campos de formulário a partir da metadata da model. */
export function formFieldsFromMeta(fields: FieldMeta[]): OonFormFieldDef[] {
  return fields.filter(isEditableField).map((f) => ({
    field: f.name,
    label: fieldLabel(f),
    kind: f.kind,
    options: f.options,
  }));
}

/** Formata um valor de célula conforme o tipo declarado. */
export function formatCell(value: unknown, kind?: FieldKind): string {
  if (value == null || value === "") return "—";
  switch (kind) {
    case "boolean":
      return value ? "Sim" : "Não";
    case "date":
      try {
        return new Date(value as string).toLocaleDateString("pt-BR");
      } catch {
        return String(value);
      }
    case "currency":
    case "currencyConverted":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
    case "ref":
      // ref populada vem como objeto { _id, nome/label } ou string id.
      if (value && typeof value === "object") {
        const obj = value as Record<string, unknown>;
        return String(obj.nome ?? obj.label ?? obj.descricao ?? obj._id ?? "—");
      }
      return String(value);
    default:
      return String(value);
  }
}
