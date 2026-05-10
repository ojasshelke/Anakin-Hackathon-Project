/**
 * measurementUtils.ts
 * Unit conversion, validation, and body measurement utilities.
 * 
 * RULE: Measurement data is PII. No console.log of measurement values.
 * RULE: No SMPL-X beta inference here — Python microservice only.
 */

import type { BodyMeasurements, MeasurementUnit } from '@/types';

// ─── Unit Conversion ─────────────────────────────────────────────────────────

const CM_PER_INCH = 2.54;

export function inchToCm(inches: number): number {
  return inches * CM_PER_INCH;
}

export function cmToInch(cm: number): number {
  return cm / CM_PER_INCH;
}

export function convertMeasurement(
  value: number,
  from: MeasurementUnit,
  to: MeasurementUnit
): number {
  if (from === to) return value;
  return from === 'inch' ? inchToCm(value) : cmToInch(value);
}

/**
 * Convert a full measurement set from one unit to another.
 * Height is always stored in cm internally.
 */
export function convertMeasurements(
  measurements: BodyMeasurements,
  from: MeasurementUnit,
  to: MeasurementUnit
): BodyMeasurements {
  if (from === to) return measurements;
  const convert = (v: number) => convertMeasurement(v, from, to);
  return {
    heightCm: convert(measurements.heightCm),
    weightKg: measurements.weightKg, // weight always in kg
    chestCm: convert(measurements.chestCm),
    waistCm: convert(measurements.waistCm),
    hipsCm: convert(measurements.hipsCm),
    inseamCm: convert(measurements.inseamCm),
    shoulderWidthCm: convert(measurements.shoulderWidthCm),
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface MeasurementValidationError {
  field: keyof BodyMeasurements;
  message: string;
}

interface MeasurementRange {
  min: number;
  max: number;
  label: string;
}

// Ranges in cm
const MEASUREMENT_RANGES_CM: Record<keyof Omit<BodyMeasurements, 'betaEstimate' | 'weightKg'>, MeasurementRange> = {
  heightCm:        { min: 120, max: 230, label: 'Height' },
  chestCm:         { min: 60,  max: 180, label: 'Chest' },
  waistCm:         { min: 50,  max: 170, label: 'Waist' },
  hipsCm:          { min: 60,  max: 180, label: 'Hips' },
  inseamCm:        { min: 50,  max: 110, label: 'Inseam' },
  shoulderWidthCm: { min: 30,  max: 80,  label: 'Shoulder width' },
};

const WEIGHT_RANGE = { min: 30, max: 300 };

export function validateMeasurements(
  m: BodyMeasurements,
  unit: MeasurementUnit = 'cm'
): MeasurementValidationError[] {
  const errors: MeasurementValidationError[] = [];
  const mInCm = unit === 'inch' ? convertMeasurements(m, 'inch', 'cm') : m;

  (Object.entries(MEASUREMENT_RANGES_CM) as [keyof typeof MEASUREMENT_RANGES_CM, MeasurementRange][]).forEach(
    ([field, { min, max, label }]) => {
      const v = mInCm[field];
      if (v === undefined || v === null || isNaN(v)) {
        errors.push({ field, message: `${label} is required` });
      } else if (v < min || v > max) {
        const displayMin = unit === 'inch' ? cmToInch(min).toFixed(1) : min;
        const displayMax = unit === 'inch' ? cmToInch(max).toFixed(1) : max;
        errors.push({
          field,
          message: `${label} must be between ${displayMin}–${displayMax} ${unit}`,
        });
      }
    }
  );

  if (!mInCm.weightKg || isNaN(mInCm.weightKg) || mInCm.weightKg < WEIGHT_RANGE.min || mInCm.weightKg > WEIGHT_RANGE.max) {
    errors.push({
      field: 'weightKg',
      message: `Weight must be between ${WEIGHT_RANGE.min}–${WEIGHT_RANGE.max} kg`,
    });
  }

  return errors;
}

// ─── Size Estimation (Heuristic) ─────────────────────────────────────────────

export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';

/**
 * Rough size estimate based on chest measurement.
 * This is a UX hint only — authoritative sizing comes from Python service.
 */
export function estimateClothingSize(chestCm: number): ClothingSize {
  if (chestCm < 82) return 'XS';
  if (chestCm < 88) return 'S';
  if (chestCm < 96) return 'M';
  if (chestCm < 104) return 'L';
  if (chestCm < 112) return 'XL';
  if (chestCm < 120) return 'XXL';
  return '3XL';
}

// ─── BMI / Body Metrics (non-PII heuristics for UI feedback only) ─────────────

export function computeBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Stub beta estimator for UI preview only.
 * NEVER use this for actual avatar generation — Python microservice only.
 * Returns a zero-array placeholder.
 */
export function betaEstimateStub(measurements: BodyMeasurements): number[] {
  // Real regression is in Python; this stub returns zeroes so the type is satisfied
  void measurements;
  return new Array(10).fill(0);
}

// ─── Measurement Field Metadata ───────────────────────────────────────────────

export interface MeasurementFieldMeta {
  key: keyof BodyMeasurements;
  label: string;
  unit: string;
  placeholder: string;
  helpText?: string;
  step: number;
}

export const MEASUREMENT_FIELDS_CM: MeasurementFieldMeta[] = [
  { key: 'heightCm',        label: 'Height',          unit: 'cm',  placeholder: '175', step: 0.5, helpText: 'Stand straight without shoes' },
  { key: 'weightKg',        label: 'Weight',          unit: 'kg',  placeholder: '70',  step: 0.5 },
  { key: 'chestCm',         label: 'Chest',           unit: 'cm',  placeholder: '95',  step: 0.5, helpText: 'Measure at the fullest point' },
  { key: 'waistCm',         label: 'Waist',           unit: 'cm',  placeholder: '80',  step: 0.5, helpText: 'Natural waistline, above navel' },
  { key: 'hipsCm',          label: 'Hips',            unit: 'cm',  placeholder: '100', step: 0.5, helpText: 'Widest point of hips' },
  { key: 'inseamCm',        label: 'Inseam',          unit: 'cm',  placeholder: '80',  step: 0.5, helpText: 'Inner leg from crotch to ankle' },
  { key: 'shoulderWidthCm', label: 'Shoulder Width',  unit: 'cm',  placeholder: '45',  step: 0.5, helpText: 'Shoulder seam to shoulder seam' },
];
