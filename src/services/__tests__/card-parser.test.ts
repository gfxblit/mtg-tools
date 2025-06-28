import * as fs from 'fs';
import * as path from 'path';
import { CardListParser } from '../card-parser';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('CardListParser', () => {
  let parser: CardListParser;

  beforeEach(() => {
    parser = new CardListParser();
    jest.clearAllMocks();
  });

  describe('parseFile', () => {
    it('should throw error if file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => parser.parseFile('nonexistent.txt')).toThrow('Input file not found: nonexistent.txt');
    });

    it('should parse valid card list file', () => {
      const fileContent = `Lightning Bolt [LEA]
4 Serra's Angel [LEA]
# This is a comment
Counterspell [LEA]`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(fileContent);

      const result = parser.parseFile('test.txt');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: 'Lightning Bolt',
        set: 'LEA',
        originalLine: 'Lightning Bolt [LEA]',
        lineNumber: 1
      });
      expect(result[1]).toEqual({
        name: 'Serra\'s Angel',
        set: 'LEA',
        originalLine: '4 Serra\'s Angel [LEA]',
        lineNumber: 2
      });
      expect(result[2]).toEqual({
        name: 'Counterspell',
        set: 'LEA',
        originalLine: 'Counterspell [LEA]',
        lineNumber: 4
      });
    });

    it('should skip empty lines and comments', () => {
      const fileContent = `
# Header comment
Lightning Bolt [LEA]

# Another comment
Counterspell [LEA]
`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(fileContent);

      const result = parser.parseFile('test.txt');

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('Lightning Bolt');
      expect(result[1]!.name).toBe('Counterspell');
    });

    it('should throw error if no valid queries found', () => {
      const fileContent = `# Only comments
# More comments`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(fileContent);

      expect(() => parser.parseFile('test.txt')).toThrow('No valid card queries found in input file');
    });

    it('should handle files with Windows line endings', () => {
      const fileContent = 'Lightning Bolt [LEA]\r\nCounterspell [LEA]\r\n';

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(fileContent);

      const result = parser.parseFile('test.txt');

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toBe('Lightning Bolt');
      expect(result[1]!.name).toBe('Counterspell');
    });

    it('should collect and warn about parsing errors', () => {
      const fileContent = `Lightning Bolt [LEA]
Invalid line without brackets
Counterspell [LEA]
Another invalid line`;

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(fileContent);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = parser.parseFile('test.txt');

      expect(result).toHaveLength(2);
      expect(consoleSpy).toHaveBeenCalledWith('Warning: Found 2 parsing errors:');
      
      consoleSpy.mockRestore();
    });
  });
});