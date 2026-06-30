import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Box, Button, Flex, Heading, Input, NativeSelect, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import type { OonFormFieldDef } from "../../types";
import { fieldLabel } from "./fieldUtils";
import { ReferenceSelect } from "./ReferenceSelect";

export interface DynamicFormProps {
  title: string;
  fields: OonFormFieldDef[];
  initialValues?: Record<string, unknown>;
  submitting?: boolean;
  error?: unknown;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
  onFieldChange?: () => void;
}

type FieldErrors = Record<string, string>;

function coerce(value: string, kind?: string): unknown {
  if (value === "") return undefined;
  if (kind === "number" || kind === "currency" || kind === "currencyConverted") return Number(value);
  if (kind === "boolean") return value === "true";
  return value;
}

function toInputValue(value: unknown, kind?: string): string {
  if (value == null) return "";
  if (kind === "date") {
    try {
      return new Date(value as string).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record._id ?? record.id ?? "");
  }
  return String(value);
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function controlId(field: string): string {
  return `oon-form-field-${field.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function errorId(field: string): string {
  return `${controlId(field)}-error`;
}

function validateRequired(fields: OonFormFieldDef[], values: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of fields) {
    if (field.required && !(values[field.field] ?? "").trim()) {
      errors[field.field] = `${fieldLabel({ name: field.field, label: field.label })} é obrigatório.`;
    }
  }
  return errors;
}

function errorMessage(error: unknown): string | null {
  if (!error) return null;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (record.error && typeof record.error === "object") {
      const envelope = record.error as Record<string, unknown>;
      if (typeof envelope.message === "string") return envelope.message;
    }
  }
  return "Não foi possível salvar o registro.";
}

function isValidationError(error: unknown): boolean {
  const message = normalize(errorMessage(error));
  if (message.includes("validacao") || message.includes("validation")) return true;
  if (!error || typeof error !== "object") return false;
  return normalize((error as Record<string, unknown>).code).includes("validation");
}

function detailsFromError(error: unknown): unknown {
  if (!error || typeof error !== "object") return null;
  const record = error as Record<string, unknown>;
  if (record.details != null) return record.details;

  if (record.error && typeof record.error === "object") {
    const envelope = record.error as Record<string, unknown>;
    if (envelope.details != null) return envelope.details;
  }

  if (record.response && typeof record.response === "object") {
    const data = (record.response as Record<string, unknown>).data;
    if (data && typeof data === "object") {
      const payload = data as Record<string, unknown>;
      if (payload.error && typeof payload.error === "object") {
        const envelope = payload.error as Record<string, unknown>;
        return envelope.details ?? envelope;
      }
      return payload.details ?? payload.errors ?? payload;
    }
  }
  return null;
}

function extractServerFieldErrors(error: unknown, fields: OonFormFieldDef[]): FieldErrors {
  const errors: FieldErrors = {};
  const fieldMap = new Map<string, OonFormFieldDef>();
  for (const field of fields) {
    fieldMap.set(normalize(field.field), field);
    fieldMap.set(normalize(field.label), field);
  }

  const resolveField = (candidate: unknown) => {
    if (typeof candidate !== "string") return undefined;
    const parts = candidate.split(/[.[\]]+/).filter(Boolean);
    for (const part of [candidate, ...parts].reverse()) {
      const match = fieldMap.get(normalize(part.replace(/[`'\"]/g, "")));
      if (match) return match;
    }
    return undefined;
  };

  const friendly = (field: OonFormFieldDef, raw: unknown) => {
    const label = fieldLabel({ name: field.field, label: field.label });
    const message = typeof raw === "string" && raw.trim() ? raw.trim() : "Revise o valor informado.";
    const normalized = normalize(message);
    if (normalized.includes("required") || normalized.includes("obrigatorio")) return `${label} é obrigatório.`;
    return message.replace(/Path\s+[`'\"]?[^`'\"\s]+[`'\"]?/i, label);
  };

  const visited = new WeakSet<object>();
  const visit = (value: unknown, keyHint?: string) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, keyHint));
      return;
    }
    if (typeof value === "string") {
      const field = resolveField(keyHint);
      if (field) errors[field.field] = friendly(field, value);
      return;
    }
    if (typeof value !== "object" || visited.has(value)) return;
    visited.add(value);

    const record = value as Record<string, unknown>;
    const candidate = record.field ?? record.path ?? record.property ?? record.name ?? record.key ?? keyHint;
    const field = resolveField(candidate);
    const message = record.message ?? record.msg ?? record.reason;
    if (field && (message == null || typeof message === "string")) {
      errors[field.field] = friendly(field, message);
    }

    for (const [key, nested] of Object.entries(record)) {
      const direct = resolveField(key);
      if (direct) {
        if (typeof nested === "string") errors[direct.field] = friendly(direct, nested);
        else if (nested && typeof nested === "object") {
          const nestedRecord = nested as Record<string, unknown>;
          errors[direct.field] = friendly(direct, nestedRecord.message ?? nestedRecord.msg ?? nestedRecord.reason);
        }
      }
      visit(nested, key);
    }
  };

  visit(detailsFromError(error));
  return errors;
}

function focusField(field: string) {
  window.setTimeout(() => {
    const element = document.getElementById(controlId(field)) as HTMLElement | null;
    element?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    element?.focus({ preventScroll: true });
  }, 0);
}

function FieldLabel({ id, label, required }: { id: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={id}>
      <Text as="span" display="block" fontSize="12px" mb={1} fontWeight="600" color="#46545C">
        {label}{required ? <Text as="span" color="red.500"> *</Text> : null}
      </Text>
    </label>
  );
}

function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return <Text id={id} role="alert" fontSize="11px" color="red.600" mt={1}>{children}</Text>;
}

/** Formulário dinâmico em diálogo, com validação detalhada por campo. */
export function DynamicForm({
  title,
  fields,
  initialValues,
  submitting,
  error,
  onSubmit,
  onCancel,
  onFieldChange,
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) initial[field.field] = toInputValue(initialValues?.[field.field], field.kind);
    return initial;
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [dismissedError, setDismissedError] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || submitting) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[role="combobox"], [role="listbox"]')) return;
      onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel, submitting]);

  useEffect(() => {
    setDismissedError(false);
    if (!error) return;
    const serverErrors = extractServerFieldErrors(error, fields);
    const fallback = isValidationError(error) ? validateRequired(fields, values) : {};
    const next = Object.keys(serverErrors).length ? serverErrors : fallback;
    if (!Object.keys(next).length) return;
    setFieldErrors((current) => ({ ...current, ...next }));
    const first = fields.find((field) => next[field.field]);
    if (first) focusField(first.field);
    // Uma nova resposta de persistência é a origem desta sincronização.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const setField = (field: string, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setDismissedError(true);
    onFieldChange?.();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateRequired(fields, values);
    if (Object.keys(validation).length) {
      setFieldErrors(validation);
      setDismissedError(true);
      const first = fields.find((field) => validation[field.field]);
      if (first) focusField(first.field);
      return;
    }

    setFieldErrors({});
    setDismissedError(false);
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const value = coerce(values[field.field] ?? "", field.kind);
      if (value !== undefined) payload[field.field] = value;
    }
    onSubmit(payload);
  };

  const invalidFields = fields
    .filter((field) => fieldErrors[field.field])
    .map((field) => ({ field: field.field, message: fieldErrors[field.field] }));
  const genericError = dismissedError ? null : errorMessage(error);
  const showGenericError = genericError && !(isValidationError(error) && invalidFields.length);

  return (
    <Flex
      position="fixed"
      inset={0}
      zIndex={1000}
      align="center"
      justify="center"
      p={{ base: 3, md: 6 }}
      bg="rgba(7, 38, 46, 0.42)"
      backdropFilter="blur(3px)"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !submitting) onCancel();
      }}
    >
      <Box bg="white" borderRadius="14px" boxShadow="0 24px 70px rgba(7, 38, 46, 0.28)" w="100%" maxW="900px" maxH="92vh" overflow="hidden">
        <Flex px={{ base: 4, md: 6 }} py={4} align="center" borderBottomWidth="1px" borderColor="#E8ECEF" bg="#FCFDFD">
          <Box>
            <Text fontSize="10px" fontWeight="700" color="brand.500" textTransform="uppercase" letterSpacing="0.08em">Cadastro</Text>
            <Heading size="md" color="#24323A">{title}</Heading>
          </Box>
          <Button ml="auto" size="sm" variant="ghost" borderRadius="8px" type="button" disabled={submitting} onClick={onCancel}>Fechar</Button>
        </Flex>

        <form noValidate onSubmit={handleSubmit}>
          <Box px={{ base: 4, md: 6 }} py={5} maxH="calc(92vh - 142px)" overflowY="auto">
            <Stack gap={4}>
              {invalidFields.length ? (
                <Box role="alert" aria-live="assertive" borderWidth="1px" borderColor="red.200" borderLeftWidth="4px" borderLeftColor="red.500" bg="red.50" borderRadius="9px" px={4} py={3}>
                  <Text fontSize="12px" fontWeight="700" color="red.700" mb={1}>Não foi possível salvar. Corrija os campos abaixo:</Text>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {invalidFields.map(({ field, message }) => (
                      <li key={field}>
                        <Button type="button" variant="plain" minH="auto" h="auto" p={0} color="red.700" fontSize="12px" fontWeight="500" textDecoration="underline" textUnderlineOffset="2px" whiteSpace="normal" textAlign="left" onClick={() => focusField(field)}>
                          {message}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Box>
              ) : null}

              {showGenericError ? (
                <Box role="alert" borderWidth="1px" borderColor="red.200" borderLeftWidth="4px" borderLeftColor="red.500" bg="red.50" borderRadius="9px" px={4} py={3}>
                  <Text fontSize="12px" color="red.700">{genericError}</Text>
                </Box>
              ) : null}

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {fields.map((field) => {
                  const label = fieldLabel({ name: field.field, label: field.label });
                  const message = fieldErrors[field.field];
                  const id = controlId(field.field);
                  const describedBy = message ? errorId(field.field) : undefined;
                  const invalidStyle = message ? "0 0 0 3px rgba(220, 38, 38, 0.10)" : undefined;

                  if (field.kind === "ref" && field.ref) {
                    return <ReferenceSelect key={field.field} field={field.field} inputId={id} errorId={describedBy} label={label} refModel={field.ref} value={values[field.field] ?? ""} initialValue={initialValues?.[field.field]} required={field.required} invalid={!!message} error={message} onChange={(value) => setField(field.field, value)} />;
                  }

                  if (field.kind === "enum" && field.options?.length) {
                    return (
                      <Box key={field.field}>
                        <FieldLabel id={id} label={label} required={field.required} />
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field id={id} aria-required={field.required} aria-invalid={!!message} aria-describedby={describedBy} value={values[field.field] ?? ""} borderRadius="8px" borderColor={message ? "red.400" : "#DDE3E7"} boxShadow={invalidStyle} onChange={(event) => setField(field.field, event.currentTarget.value)}>
                            <option value="">Selecione...</option>
                            {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        <FieldError id={describedBy}>{message}</FieldError>
                      </Box>
                    );
                  }

                  if (field.kind === "boolean") {
                    return (
                      <Box key={field.field}>
                        <FieldLabel id={id} label={label} required={field.required} />
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field id={id} aria-required={field.required} aria-invalid={!!message} aria-describedby={describedBy} value={values[field.field] ?? ""} borderRadius="8px" borderColor={message ? "red.400" : "#DDE3E7"} boxShadow={invalidStyle} onChange={(event) => setField(field.field, event.currentTarget.value)}>
                            <option value="">Selecione...</option>
                            <option value="true">Sim</option>
                            <option value="false">Não</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        <FieldError id={describedBy}>{message}</FieldError>
                      </Box>
                    );
                  }

                  const inputType = field.kind === "date" ? "date" : field.kind === "number" || field.kind === "currency" || field.kind === "currencyConverted" ? "number" : "text";
                  return (
                    <Box key={field.field}>
                      <FieldLabel id={id} label={label} required={field.required} />
                      <Input id={id} size="sm" type={inputType} required={field.required} aria-required={field.required} aria-invalid={!!message} aria-describedby={describedBy} borderRadius="8px" borderColor={message ? "red.400" : "#DDE3E7"} boxShadow={invalidStyle} value={values[field.field] ?? ""} onChange={(event) => setField(field.field, event.currentTarget.value)} _focusVisible={{ borderColor: message ? "red.500" : "brand.500", boxShadow: `0 0 0 1px ${message ? "#E53E3E" : "#0474AF"}` }} />
                      <FieldError id={describedBy}>{message}</FieldError>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Stack>
          </Box>

          <Flex px={{ base: 4, md: 6 }} py={4} gap={3} justify="end" borderTopWidth="1px" borderColor="#E8ECEF" bg="#FCFDFD">
            <Button size="sm" variant="outline" borderRadius="8px" type="button" disabled={submitting} onClick={onCancel}>Cancelar</Button>
            <Button size="sm" colorPalette="brand" borderRadius="8px" type="submit" loading={submitting}>Salvar</Button>
          </Flex>
        </form>
      </Box>
    </Flex>
  );
}
