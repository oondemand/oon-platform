import { useEffect, useState, type FormEvent } from "react";
import { Box, Button, Flex, Heading, Input, NativeSelect, SimpleGrid, Stack, Text, Textarea } from "@chakra-ui/react";
import type { OonFormFieldDef } from "../../types";
import { fieldLabel } from "./fieldUtils";
import { ReferenceSelect } from "./ReferenceSelect";

export interface DynamicFormProps {
  title: string;
  eyebrow?: string;
  fields: OonFormFieldDef[];
  initialValues?: Record<string, unknown>;
  submitting?: boolean;
  error?: unknown;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
  onFieldChange?: () => void;
}

type FieldErrors = Record<string, string>;
type ExtendedField = OonFormFieldDef & { multiline?: boolean; rows?: number; span?: 1 | 2 };

const idFor = (field: string) => `oon-form-field-${field.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
const errorIdFor = (field: string) => `${idFor(field)}-error`;
const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function CloseIcon() {
  return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m6 6 8 8M14 6l-8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="m6.8 10.1 2 2 4.3-4.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function AlertIcon() {
  return <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M10 6.5v4.2M10 13.5v.1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function toValue(value: unknown, kind?: string) {
  if (value == null) return "";
  if (kind === "date") {
    try { return new Date(value as string).toISOString().slice(0, 10); } catch { return ""; }
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record._id ?? record.id ?? "");
  }
  return String(value);
}

function coerce(value: string, kind?: string): unknown {
  if (value === "") return undefined;
  if (["number", "currency", "currencyConverted"].includes(kind ?? "")) return Number(value);
  if (kind === "boolean") return value === "true";
  return value;
}

function validate(fields: OonFormFieldDef[], values: Record<string, string>) {
  const errors: FieldErrors = {};
  fields.forEach((field) => {
    if (field.required && !(values[field.field] ?? "").trim()) errors[field.field] = `${fieldLabel({ name: field.field, label: field.label })} é obrigatório.`;
  });
  return errors;
}

function messageOf(error: unknown) {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (record.error && typeof record.error === "object" && typeof (record.error as Record<string, unknown>).message === "string") return (record.error as Record<string, unknown>).message as string;
  }
  return "Não foi possível salvar o registro.";
}

function detailErrors(error: unknown, fields: OonFormFieldDef[]) {
  const result: FieldErrors = {};
  const lookup = new Map(fields.flatMap((field) => [[normalize(field.field), field], [normalize(field.label), field]] as Array<[string, OonFormFieldDef]>));
  const seen = new WeakSet<object>();
  const visit = (value: unknown, hint?: string) => {
    if (value == null) return;
    if (Array.isArray(value)) return value.forEach((item) => visit(item, hint));
    if (typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    const record = value as Record<string, unknown>;
    const candidate = String(record.field ?? record.path ?? record.property ?? record.name ?? hint ?? "");
    const field = lookup.get(normalize(candidate.split(/[.[\]]+/).filter(Boolean).pop() ?? candidate));
    const raw = record.message ?? record.msg ?? record.reason;
    if (field && typeof raw === "string") result[field.field] = /required|obrigat/i.test(raw) ? `${fieldLabel({ name: field.field, label: field.label })} é obrigatório.` : raw;
    Object.entries(record).forEach(([key, nested]) => {
      const direct = lookup.get(normalize(key));
      if (direct && typeof nested === "string") result[direct.field] = nested;
      visit(nested, key);
    });
  };
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    visit(record.details ?? (record.error as Record<string, unknown> | undefined)?.details ?? record);
  }
  return result;
}

function focusField(field: string) {
  window.setTimeout(() => {
    const element = document.getElementById(idFor(field)) as HTMLElement | null;
    element?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    element?.focus({ preventScroll: true });
  }, 0);
}

function isMultiline(field: ExtendedField) {
  return field.multiline === true || /observa|descricao|mensagem|detalhe|necessidade/i.test(field.field);
}

function Label({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return <label htmlFor={id}><Text as="span" display="block" mb="6px" color="#475467" fontSize="11px" fontWeight="600">{label}{required ? <Text as="span" color="#DC2626"> *</Text> : null}</Text></label>;
}

function ErrorText({ id, text }: { id?: string; text?: string }) {
  return text ? <Text id={id} role="alert" mt="5px" color="#DC2626" fontSize="10px" fontWeight="500">{text}</Text> : null;
}

const controlProps = (invalid: boolean) => ({
  minH: "37px",
  px: "10px",
  py: "8px",
  color: "#475467",
  bg: "white",
  borderColor: invalid ? "#DC2626" : "#D5DDE3",
  borderRadius: "6px",
  boxShadow: invalid ? "0 0 0 3px rgba(220,38,38,.08)" : undefined,
  fontSize: "11px",
});

export function DynamicForm({ title, eyebrow = "Cadastro", fields, initialValues, submitting, error, onSubmit, onCancel, onFieldChange }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((field) => [field.field, toValue(initialValues?.[field.field], field.kind)])));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || submitting) return;
      if ((event.target as HTMLElement | null)?.closest('[role="combobox"], [role="listbox"]')) return;
      onCancel();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [onCancel, submitting]);

  useEffect(() => {
    setDismissed(false);
    if (!error) return;
    const detailed = detailErrors(error, fields);
    const fallback = /validacao|validation/i.test(normalize(messageOf(error))) ? validate(fields, values) : {};
    const next = Object.keys(detailed).length ? detailed : fallback;
    if (!Object.keys(next).length) return;
    setErrors((current) => ({ ...current, ...next }));
    const first = fields.find((field) => next[field.field]);
    if (first) focusField(first.field);
  }, [error]);

  const change = (field: string, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next; });
    setDismissed(true);
    onFieldChange?.();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate(fields, values);
    if (Object.keys(validation).length) {
      setErrors(validation);
      setDismissed(true);
      const first = fields.find((field) => validation[field.field]);
      if (first) focusField(first.field);
      return;
    }
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => { const value = coerce(values[field.field] ?? "", field.kind); if (value !== undefined) payload[field.field] = value; });
    setErrors({});
    onSubmit(payload);
  };

  const invalid = fields.filter((field) => errors[field.field]);
  const generic = dismissed ? null : messageOf(error);

  return (
    <Flex position="fixed" inset={0} zIndex={1000} align="center" justify="center" p={{ base: 2, md: 6 }} bg="rgba(15,23,42,.48)" backdropFilter="blur(2px)" onMouseDown={(event) => { if (event.currentTarget === event.target && !submitting) onCancel(); }}>
      <Box role="dialog" aria-modal="true" aria-label={title} w="min(860px, 96vw)" maxH="min(880px, 94vh)" overflow="hidden" bg="white" borderWidth="1px" borderColor="#E5E9ED" borderRadius="14px" boxShadow="0 24px 70px rgba(15,23,42,.24)">
        <Flex minH="76px" px="20px" py="16px" align="center" justify="space-between" borderBottomWidth="1px" borderColor="#E5E9ED">
          <Box><Text color="#0474AF" fontSize="10px" fontWeight="600" letterSpacing=".07em" textTransform="uppercase">{eyebrow}</Text><Heading mt="3px" color="#344054" fontSize="18px" fontWeight="600">{title}</Heading></Box>
          <Button type="button" aria-label="Fechar" w="31px" minW="31px" h="31px" p={0} color="#667085" bg="white" borderWidth="1px" borderColor="#E5E9ED" borderRadius="6px" disabled={submitting} onClick={onCancel} _hover={{ color: "#036491", bg: "#F0F7FF", borderColor: "#B8D9EB" }}><CloseIcon /></Button>
        </Flex>

        <form noValidate onSubmit={submit}>
          <Box maxH="calc(94vh - 148px)" px="20px" pt="18px" pb="24px" overflowY="auto">
            <Stack gap={4}>
              {invalid.length ? <Box role="alert" p="11px 13px" color="#9B1C1C" bg="#FFF5F5" borderWidth="1px" borderColor="#FECACA" borderLeftWidth="4px" borderLeftColor="#DC2626" borderRadius="8px" fontSize="11px"><Flex align="center" gap="7px"><AlertIcon /><Text as="strong">Não foi possível salvar. Corrija os campos abaixo:</Text></Flex><Box as="ul" mt="7px" mb={0} pl="20px" display="grid" gap="3px">{invalid.map((field) => <li key={field.field}><Button type="button" variant="plain" minH="auto" h="auto" p={0} color="#B42318" fontSize="10px" fontWeight="400" textDecoration="underline" onClick={() => focusField(field.field)}>{fieldLabel({ name: field.field, label: field.label })}: {errors[field.field]}</Button></li>)}</Box></Box> : null}
              {generic && !invalid.length ? <Flex role="alert" p="10px 12px" align="center" gap={2} color="#B42318" bg="#FEF3F2" borderWidth="1px" borderColor="#FECDCA" borderRadius="7px" fontSize="11px"><AlertIcon />{generic}</Flex> : null}

              <SimpleGrid columns={{ base: 1, lg: 2 }} gapX="16px" gapY="15px">
                {fields.map((baseField) => {
                  const field = baseField as ExtendedField;
                  const label = fieldLabel({ name: field.field, label: field.label });
                  const message = errors[field.field];
                  const id = idFor(field.field);
                  const errorId = message ? errorIdFor(field.field) : undefined;
                  const multiline = isMultiline(field);
                  const span = field.span === 2 || multiline;
                  const wrap = (control: React.ReactNode) => <Box key={field.field} gridColumn={span ? "1 / -1" : undefined}><Label id={id} label={label} required={field.required} />{control}<ErrorText id={errorId} text={message} /></Box>;

                  if (field.kind === "ref" && field.ref) return wrap(<ReferenceSelect field={field.field} inputId={id} errorId={errorId} label={label} refModel={field.ref} value={values[field.field] ?? ""} initialValue={initialValues?.[field.field]} required={field.required} invalid={!!message} error={message} onChange={(value) => change(field.field, value)} />);
                  if (field.kind === "enum" && field.options?.length) return wrap(<NativeSelect.Root size="sm"><NativeSelect.Field id={id} aria-invalid={!!message} aria-describedby={errorId} value={values[field.field] ?? ""} {...controlProps(!!message)} onChange={(event) => change(field.field, event.currentTarget.value)}><option value="">— Selecione —</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root>);
                  if (field.kind === "boolean") return wrap(<NativeSelect.Root size="sm"><NativeSelect.Field id={id} aria-invalid={!!message} aria-describedby={errorId} value={values[field.field] ?? ""} {...controlProps(!!message)} onChange={(event) => change(field.field, event.currentTarget.value)}><option value="">— Selecione —</option><option value="true">Sim</option><option value="false">Não</option></NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root>);
                  if (multiline) return wrap(<Textarea id={id} rows={field.rows ?? 4} resize="vertical" aria-invalid={!!message} aria-describedby={errorId} value={values[field.field] ?? ""} {...controlProps(!!message)} lineHeight="1.5" onChange={(event) => change(field.field, event.currentTarget.value)} />);
                  const type = field.kind === "date" ? "date" : ["number", "currency", "currencyConverted"].includes(field.kind ?? "") ? "number" : "text";
                  return wrap(<Input id={id} type={type} step={type === "number" ? "any" : undefined} autoComplete="off" aria-invalid={!!message} aria-describedby={errorId} value={values[field.field] ?? ""} {...controlProps(!!message)} onChange={(event) => change(field.field, event.currentTarget.value)} />);
                })}
              </SimpleGrid>
            </Stack>
          </Box>

          <Flex minH="68px" px="20px" py="14px" justify="flex-end" gap="9px" borderTopWidth="1px" borderColor="#E5E9ED"><Button type="button" minH="35px" px="13px" color="#475467" bg="white" borderWidth="1px" borderColor="#D5DDE3" borderRadius="6px" fontSize="11px" fontWeight="600" disabled={submitting} onClick={onCancel}>Cancelar</Button><Button type="submit" minH="35px" px="13px" colorPalette="brand" borderRadius="6px" fontSize="11px" fontWeight="600" loading={submitting}><CheckIcon /> Salvar</Button></Flex>
        </form>
      </Box>
    </Flex>
  );
}
