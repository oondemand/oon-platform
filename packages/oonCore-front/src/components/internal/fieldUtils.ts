import type { FieldKind, FieldMeta, OonColumnDef, OonFormFieldDef } from "../../types";

/** Campos que normalmente não fazem sentido em grid/form de CRUD. */
const HIDDEN_FIELDS = new Set(["__v", "_id", "createdAt", "updatedAt", "criadoEm", "atualizadoEm"]);

export function isEditableField(meta: FieldMeta): boolean {
  return !HIDDEN_FIELDS.has(meta.name) && meta.kind !== "raw";
}

export function fieldLabel(meta: { name: string; label?: string }): string {
  if (meta.label) return meta.label;
  return meta.name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

/** Deriva colunas de grid a partir da metadata da model (modo dynamic/minimal). */
export function columnsFromMeta(fields: FieldMeta[]): OonColumnDef[] {
  return fields
    .filter(isEditableField)
    .slice(0, 8)
    .map((field) => ({ field: field.name, label: fieldLabel(field), kind: field.kind, sortable: true }));
}

function formRequired(field: FieldMeta): boolean {
  const raw = field as unknown as Record<string, unknown>;
  const options = raw.options;
  const validation = raw.validation;
  const schema = raw.schema;

  return Boolean(
    field.required ||
      (options && !Array.isArray(options) && typeof options === "object" && (options as Record<string, unknown>).required) ||
      (validation && typeof validation === "object" && (validation as Record<string, unknown>).required) ||
      (schema && typeof schema === "object" && (schema as Record<string, unknown>).required)
  );
}

function formOptions(field: FieldMeta): string[] | undefined {
  const rawOptions = (field as unknown as Record<string, unknown>).options;
  if (Array.isArray(rawOptions)) return rawOptions.filter((value): value is string => typeof value === "string");
  if (!rawOptions || typeof rawOptions !== "object") return undefined;

  const options = rawOptions as Record<string, unknown>;
  const candidates = [options.values, options.enum, options.options];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter((value): value is string => typeof value === "string");
  }
  return undefined;
}

/** Deriva campos de formulário a partir da metadata da model. */
export function formFieldsFromMeta(fields: FieldMeta[]): OonFormFieldDef[] {
  return fields.filter(isEditableField).map((field) => ({
    field: field.name,
    label: fieldLabel(field),
    kind: field.kind,
    required: formRequired(field),
    options: formOptions(field),
    ref: field.ref,
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
      if (value && typeof value === "object") {
        const object = value as Record<string, unknown>;
        return String(object.nome ?? object.label ?? object.descricao ?? object._id ?? "—");
      }
      return String(value);
    default:
      return String(value);
  }
}
