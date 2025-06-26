import * as fs from 'fs';
import * as path from 'path';
import { ScryfallCard } from '../types/scryfall';
import { MarkdownGenerator } from './markdown-generator';

/**
 * Options for markdown export
 */
export interface MarkdownExportOptions {
  outputDirectory: string;
}

/**
 * Service for writing markdown files from MTG cards
 */
export class MarkdownWriter {
  private generator: MarkdownGenerator;

  constructor() {
    this.generator = new MarkdownGenerator();
  }

  /**
   * Write cards to separate markdown files with an index
   */
  public writeCardsToMarkdown(cards: ScryfallCard[], options: MarkdownExportOptions): void {
    // Ensure output directory exists
    this.ensureDirectoryExists(options.outputDirectory);

    // Write each card to a separate file
    this.writeCardsToSeparateFiles(cards, options);

    // Write index file
    this.writeIndexFile(cards, options);

    console.log(`Successfully exported ${cards.length} cards to ${options.outputDirectory}`);
  }

  /**
   * Write each card to a separate markdown file
   */
  private writeCardsToSeparateFiles(cards: ScryfallCard[], options: MarkdownExportOptions): void {
    for (const card of cards) {
      const cardMarkdown = this.generator.generateCardMarkdown(card);
      const filename = this.generator.sanitizeFilename(card.name) + '.md';
      const filePath = path.join(options.outputDirectory, filename);
      
      this.writeFile(filePath, cardMarkdown);
    }

    console.log(`Wrote ${cards.length} individual card files`);
  }

  /**
   * Write index file
   */
  private writeIndexFile(cards: ScryfallCard[], options: MarkdownExportOptions): void {
    const indexMarkdown = this.generator.generateIndexMarkdown(cards);
    const filePath = path.join(options.outputDirectory, 'index.md');
    
    this.writeFile(filePath, indexMarkdown);
    console.log(`Wrote index file: index.md`);
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Write content to file
   */
  private writeFile(filePath: string, content: string): void {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}