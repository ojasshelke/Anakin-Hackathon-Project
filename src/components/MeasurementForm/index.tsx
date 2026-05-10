"use client";

/**
 * MeasurementForm — typed, validated body measurement input form.
 * Named export only. One component per file.
 *
 * RULE: Measurement data is PII — no console.log of values.
 * RULE: "use client" — uses React state and event handlers.
 */

import React, { useState, useCallback } from 'react';
import {
  MEASUREMENT_FIELDS_CM,
  validateMeasurements,
  convertMeasurements,
  estimateClothingSize,
  type MeasurementValidationError,
} from '@/lib/measurementUtils';
import type { BodyMeasurements, MeasurementUnit } from '@/types';
import { Ruler, Info, ChevronDown } from 'lucide-react';

interface MeasurementFormProps {
  onSubmit: (measurements: BodyMeasurements) => void;
  isLoading?: boolean;
  defaultValues?: Partial<BodyMeasurements>;
}

const EMPTY_FORM: Record<string, string> = {
  heightCm: '',
  weightKg: '',
  chestCm: '',
  waistCm: '',
  hipsCm: '',
  inseamCm: '',
  shoulderWidthCm: '',
};

export function MeasurementForm({ onSubmit, isLoading = false, defaultValues = {} }: MeasurementFormProps) {
  const [unit, setUnit] = useState<MeasurementUnit>('cm');
  const [formValues, setFormValues] = useState<Record<string, string>>({
    ...EMPTY_FORM,
    ...Object.fromEntries(
      Object.entries(defaultValues).map(([k, v]) => [k, v?.toString() ?? ''])
    ),
  });
  const [errors, setErrors] = useState<MeasurementValidationError[]>([]);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const getFieldError = (key: string): string | undefined =>
    errors.find((e) => e.field === key)?.message;

  const handleChange = useCallback(
    (key: string, value: string) => {
      setFormValues((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => new Set(prev).add(key));
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed: BodyMeasurements = {
      heightCm: parseFloat(formValues.heightCm ?? '') || 0,
      weightKg: parseFloat(formValues.weightKg ?? '') || 0,
      chestCm: parseFloat(formValues.chestCm ?? '') || 0,
      waistCm: parseFloat(formValues.waistCm ?? '') || 0,
      hipsCm: parseFloat(formValues.hipsCm ?? '') || 0,
      inseamCm: parseFloat(formValues.inseamCm ?? '') || 0,
      shoulderWidthCm: parseFloat(formValues.shoulderWidthCm ?? '') || 0,
    };

    const inCm = unit === 'inch' ? convertMeasurements(parsed, 'inch', 'cm') : parsed;
    const validationErrors = validateMeasurements(inCm, 'cm');

    setErrors(validationErrors);
    // Mark all fields as touched on submit
    setTouched(new Set(MEASUREMENT_FIELDS_CM.map((f) => f.key)));

    if (validationErrors.length === 0) {
      onSubmit(inCm);
    }
  };

  // Estimate size for UI feedback (heuristic only)
  const chestVal = parseFloat(formValues.chestCm ?? '');
  const estimatedSize =
    !isNaN(chestVal) && chestVal > 0
      ? estimateClothingSize(unit === 'inch' ? chestVal * 2.54 : chestVal)
      : null;

  const displayLabel = (field: typeof MEASUREMENT_FIELDS_CM[0]) => {
    if (field.key === 'weightKg') return `${field.label} (kg)`;
    return `${field.label} (${unit})`;
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6" noValidate>
      {/* Unit Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-[#bef264]" />
          <span className="text-white font-semibold text-lg">Body Measurements</span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {(['cm', 'inch'] as MeasurementUnit[]).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                unit === u
                  ? 'bg-[#bef264] text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated Size Badge */}
      {estimatedSize && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#bef264]/10 border border-[#bef264]/20">
          <span className="text-sm text-white/70">Estimated size:</span>
          <span className="text-[#bef264] font-bold text-sm">{estimatedSize}</span>
          <span className="text-white/40 text-xs ml-auto">(heuristic only)</span>
        </div>
      )}

      {/* Measurement Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MEASUREMENT_FIELDS_CM.map((field) => {
          const fieldError = touched.has(field.key) ? getFieldError(field.key) : undefined;
          const value = formValues[field.key] ?? '';

          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <label
                  htmlFor={`measurement-${field.key}`}
                  className="text-sm font-medium text-white/80"
                >
                  {displayLabel(field)}
                </label>
                {field.helpText && (
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-white/30 cursor-help" />
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 rounded-lg bg-[#1a1a2e] border border-white/10 text-xs text-white/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                      {field.helpText}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  id={`measurement-${field.key}`}
                  type="number"
                  step={field.step}
                  placeholder={
                    unit === 'inch' && field.key !== 'weightKg'
                      ? (parseFloat(field.placeholder) / 2.54).toFixed(1)
                      : field.placeholder
                  }
                  value={value}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onBlur={() => setTouched((prev) => new Set(prev).add(field.key))}
                  className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all duration-200 text-sm ${
                    fieldError
                      ? 'border-red-500/60 focus:ring-red-500/30'
                      : 'border-white/10 focus:ring-[#bef264]/30 focus:border-[#bef264]/40'
                  }`}
                />
              </div>

              {fieldError && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span>⚠</span> {fieldError}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 rounded-2xl font-semibold text-base bg-[#bef264] text-black hover:bg-[#a3e635] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_30px_rgba(190,242,100,0.3)] hover:shadow-[0_0_40px_rgba(190,242,100,0.5)] flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Ruler className="w-4 h-4" />
            Save Measurements & Generate Avatar
          </>
        )}
      </button>
    </form>
  );
}
