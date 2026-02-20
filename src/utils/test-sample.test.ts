import { describe, it, expect } from 'vitest';
import { add, subtract } from './math';

describe('Math Utils', () => {
  it('should add numbers', () => {
    expect(add(1, 2)).toBe(3);
  });

  it('should subtract numbers', () => {
    expect(subtract(3, 1)).toBe(2);
  });
});
