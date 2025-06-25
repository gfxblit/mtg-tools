import * as fs from 'fs';
import * as path from 'path';
import { ScryfallCard } from '../types/scryfall';
import { MatchResult } from '../types/card-query';

/**
 * Class for writing output files
 */
export class OutputWriter {
  /**
   * Write matched cards to a JSON file
   * @param matchResult The result of the matching operation
   * @param outputPath Path where to write the output file
   */
  public writeToFile(matchResult: MatchResult, outputPath: string): void {
    // Extract just the cards from the matches
    const cards = matchResult.matches.map(match => match.card);
    
    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Convert cards to JSON
    const jsonContent = JSON.stringify(cards, null, 2);

    // Write to file
    try {
      fs.writeFileSync(outputPath, jsonContent, 'utf-8');
      console.log(`Successfully wrote ${cards.length} cards to ${path.basename(outputPath)}`);
    } catch (error) {
      throw new Error(`Failed to write output file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}