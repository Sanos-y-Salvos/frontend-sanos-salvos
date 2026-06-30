import { describe, it, expect } from 'vitest';
import { formatRut, parseRut } from '../../utils/rutFormatter';

describe('formatRut', () => {
  it('returns empty string for empty input', () => {
    expect(formatRut('')).toBe('');
  });

  it('returns single character for single digit', () => {
    expect(formatRut('1')).toBe('1');
  });

  it('formats short RUT without dots', () => {
    expect(formatRut('123')).toBe('12-3');
  });

  it('formats typical 8-digit RUT', () => {
    expect(formatRut('111111111')).toBe('11.111.111-1');
  });

  it('formats RUT with K verifier', () => {
    expect(formatRut('123456789k')).toBe('12.345.678-9');
  });

  it('strips non-numeric and non-K chars', () => {
    expect(formatRut('11.111.111-1')).toBe('11.111.111-1');
  });

  it('uppercases K verifier', () => {
    expect(formatRut('7654321k')).toBe('7.654.321-K');
  });

  it('truncates to 9 chars max', () => {
    expect(formatRut('123456789012')).toBe('12.345.678-9');
  });

  it('returns digit-dash-verifier for 2-char input', () => {
    expect(formatRut('12')).toBe('1-2');
  });
});

describe('parseRut', () => {
  it('removes dots from formatted RUT', () => {
    expect(parseRut('11.111.111-1')).toBe('11111111-1');
  });

  it('leaves RUT without dots unchanged', () => {
    expect(parseRut('11111111-1')).toBe('11111111-1');
  });

  it('handles K verifier', () => {
    expect(parseRut('76.354.771-K')).toBe('76354771-K');
  });

  it('handles empty string', () => {
    expect(parseRut('')).toBe('');
  });
});
