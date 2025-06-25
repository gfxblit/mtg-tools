import * as fs from 'fs';
import * as path from 'path';
import { CardQuery } from '../types/card-query';
import { parseCardLine, shouldSkipLine } from '../utils/string-utils';

/**
 * Class for parsing card queries from input files
 */
export class CardListParser {
  /**
   * Parse a text file containing card names and sets
   * @param filePath Path to the input file
   * @returns Array of parsed card queries
   */
  public parseFile(filePath: string): CardQuery[] {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Input file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const queries: CardQuery[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue; // Skip undefined lines
      
      const lineNumber = i + 1;

      // Skip empty lines and comments
      if (shouldSkipLine(line)) {
        continue;
      }

      try {
        const query = this.parseLine(line, lineNumber);
        if (query) {
          queries.push(query);
        }
      } catch (error) {
        const errorMsg = `Line ${lineNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
      }
    }

    if (errors.length > 0) {
      console.warn(`Warning: Found ${errors.length} parsing errors:`);
      errors.forEach(error => console.warn(`  ${error}`));
    }

    if (queries.length === 0) {
      throw new Error('No valid card queries found in input file');
    }

    console.log(`Parsed ${queries.length} card queries from ${path.basename(filePath)}`);
    return queries;
  }

  /**
   * Parse a single line into a CardQuery
   * @param line The line to parse
   * @param lineNumber Line number for error reporting
   * @returns CardQuery or null if line should be skipped
   */
  private parseLine(line: string, lineNumber: number): CardQuery | null {
    const parsed = parseCardLine(line);
    
    if (!parsed) {
      throw new Error(`Invalid format. Expected "Card Name [SET]" but got: "${line.trim()}"`);
    }

    return {
      name: parsed.name,
      set: parsed.set,
      originalLine: line.trim(),
      lineNumber
    };
  }
}