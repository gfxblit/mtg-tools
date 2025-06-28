import { normalizeString, parseCardLine, shouldSkipLine, validateFileExtension } from '../string-utils';

describe('string-utils', () => {
  describe('normalizeString', () => {
    it('should trim whitespace and convert to lowercase', () => {
      expect(normalizeString('  HELLO WORLD  ')).toBe('hello world');
      expect(normalizeString('Mixed Case')).toBe('mixed case');
      expect(normalizeString('')).toBe('');
    });
  });

  describe('parseCardLine', () => {
    it('should parse card name and set correctly', () => {
      const result = parseCardLine('Lightning Bolt [LEA]');
      expect(result).toEqual({ name: 'Lightning Bolt', set: 'LEA' });
    });

    it('should parse card with quantity prefix', () => {
      const result = parseCardLine('4 Lightning Bolt [LEA]');
      expect(result).toEqual({ name: 'Lightning Bolt', set: 'LEA' });
    });

    it('should handle whitespace around card names and sets', () => {
      const result = parseCardLine('  Lightning Bolt  [ LEA ] ');
      expect(result).toEqual({ name: 'Lightning Bolt', set: 'LEA' });
    });

    it('should ignore comments after #', () => {
      const result = parseCardLine('Lightning Bolt [LEA] # This is a comment');
      expect(result).toEqual({ name: 'Lightning Bolt', set: 'LEA' });
    });

    it('should return null for invalid formats', () => {
      expect(parseCardLine('Lightning Bolt')).toBeNull();
      expect(parseCardLine('[LEA]')).toBeNull();
      expect(parseCardLine('')).toBeNull();
      expect(parseCardLine('Lightning Bolt []')).toBeNull();
    });

    it('should handle complex card names', () => {
      const result = parseCardLine('Serra\'s Angel [LEA]');
      expect(result).toEqual({ name: 'Serra\'s Angel', set: 'LEA' });
    });

    it('should handle card names with special characters', () => {
      // Test commas in planeswalker names
      const result1 = parseCardLine('Jace, the Mind Sculptor [WWK]');
      expect(result1).toEqual({ name: 'Jace, the Mind Sculptor', set: 'WWK' });

      // Test apostrophes
      const result2 = parseCardLine('Serra\'s Angel [LEA]');
      expect(result2).toEqual({ name: 'Serra\'s Angel', set: 'LEA' });

      // Test hyphens
      const result3 = parseCardLine('Elspeth, Knight-Errant [ALA]');
      expect(result3).toEqual({ name: 'Elspeth, Knight-Errant', set: 'ALA' });

      // Test unicode characters (diacritical marks)
      const result4 = parseCardLine('Lim-Dûl\'s Vault [ICE]');
      expect(result4).toEqual({ name: 'Lim-Dûl\'s Vault', set: 'ICE' });

      // Test ligatures
      const result5 = parseCardLine('Æther Vial [DST]');
      expect(result5).toEqual({ name: 'Æther Vial', set: 'DST' });
    });
  });

  describe('shouldSkipLine', () => {
    it('should skip empty lines', () => {
      expect(shouldSkipLine('')).toBe(true);
      expect(shouldSkipLine('   ')).toBe(true);
    });

    it('should skip comment lines', () => {
      expect(shouldSkipLine('# This is a comment')).toBe(true);
      expect(shouldSkipLine('  # This is also a comment')).toBe(true);
    });

    it('should not skip valid lines', () => {
      expect(shouldSkipLine('Lightning Bolt [LEA]')).toBe(false);
      expect(shouldSkipLine('4 Lightning Bolt [LEA]')).toBe(false);
    });
  });

  describe('validateFileExtension', () => {
    it('should validate correct extensions', () => {
      expect(validateFileExtension('file.txt', '.txt')).toBe(true);
      expect(validateFileExtension('file.json', '.json')).toBe(true);
      expect(validateFileExtension('FILE.TXT', '.txt')).toBe(true);
    });

    it('should reject incorrect extensions', () => {
      expect(validateFileExtension('file.txt', '.json')).toBe(false);
      expect(validateFileExtension('file', '.txt')).toBe(false);
    });
  });
});