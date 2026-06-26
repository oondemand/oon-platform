/**
 * `fields` — tipos prontos para declarar schemas em `defineModel` (Seção 2.4).
 *
 * Cada helper retorna um descriptor `{ ...mongoose, __meta }`. O bloco
 * `__meta` é consumido pelo registry para gerar metadata/OpenAPI para o
 * front, sem vazar para o schema Mongoose final.
 */
const mongoose = require("mongoose");

const withMeta = (mongooseDef, meta) => ({
  ...mongooseDef,
  __meta: { required: !!mongooseDef.required, ...meta },
});

const string = (opts = {}) =>
  withMeta(
    { type: String, required: !!opts.required, default: opts.default, trim: true },
    { kind: "string", label: opts.label, searchable: opts.searchable !== false }
  );

const number = (opts = {}) =>
  withMeta(
    { type: Number, required: !!opts.required, default: opts.default },
    { kind: "number", label: opts.label }
  );

const boolean = (opts = {}) =>
  withMeta(
    { type: Boolean, required: !!opts.required, default: opts.default ?? false },
    { kind: "boolean", label: opts.label }
  );

const date = (opts = {}) =>
  withMeta(
    { type: Date, required: !!opts.required, default: opts.default },
    { kind: "date", label: opts.label }
  );

const ref = (modelName, opts = {}) =>
  withMeta(
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: modelName,
      required: !!opts.required,
    },
    { kind: "ref", ref: modelName, label: opts.label }
  );

const enumField = (values, opts = {}) =>
  withMeta(
    {
      type: String,
      enum: values,
      required: !!opts.required,
      default: opts.default,
    },
    { kind: "enum", options: values, label: opts.label }
  );

const currency = (opts = {}) =>
  withMeta(
    { type: Number, required: !!opts.required, default: opts.default ?? 0, min: 0 },
    { kind: "currency", label: opts.label }
  );

const currencyCode = (opts = {}) =>
  withMeta(
    {
      type: String,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: opts.default || "BRL",
      required: !!opts.required,
    },
    { kind: "currencyCode", label: opts.label }
  );

const currencyConverted = (opts = {}) =>
  withMeta(
    { type: Number, default: opts.default ?? 0, min: 0 },
    { kind: "currencyConverted", base: opts.base || "BRL", label: opts.label }
  );

module.exports = {
  string,
  number,
  boolean,
  date,
  ref,
  enum: enumField,
  currency,
  currencyCode,
  currencyConverted,
};
