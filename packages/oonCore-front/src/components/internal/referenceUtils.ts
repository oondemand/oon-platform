const COMMON_LABEL_FIELDS = [
  "nome",
  "razaoSocial",
  "razao_social",
  "descricao",
  "numero",
  "codigoIndividual",
  "codigo_individual",
  "codigo",
  "label",
  "email",
];

function primitiveText(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return null;
}

/**
 * Resolve um rótulo humano para qualquer registro relacionado. Prioriza campos
 * conhecidos e depois os campos pesquisáveis expostos pela metadata.
 */
export function referenceOptionLabel(
  row: Record<string, unknown>,
  searchableFields: string[] = []
): string {
  const ordered = [...COMMON_LABEL_FIELDS, ...searchableFields];
  const seenFields = new Set<string>();
  const seenValues = new Set<string>();
  const values: string[] = [];

  for (const field of ordered) {
    if (seenFields.has(field)) continue;
    seenFields.add(field);
    const text = primitiveText(row[field]);
    if (!text || seenValues.has(text)) continue;
    seenValues.add(text);
    values.push(text);
    if (values.length === 2) break;
  }

  if (values.length) return values.join(" — ");
  return primitiveText(row._id) ?? primitiveText(row.id) ?? "Registro sem identificação";
}

export function initialReferenceLabel(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  return referenceOptionLabel(value as Record<string, unknown>);
}

export function referenceId(row: Record<string, unknown>): string {
  return String(row._id ?? row.id ?? "");
}
