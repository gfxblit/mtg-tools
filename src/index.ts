#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import { CardListParser } from './services/card-parser';
import { CardDatabase } from './services/card-database';
import { OutputWriter } from './services/output-writer';
import { MarkdownWriter } from './services/markdown-writer';
import { FilterOptions } from './types/card-query';

interface ExportOptions {
  input: string;
  database: string;
  output: string;
}

/**
 * Main application class
 */
class CardFilterTool {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCLI();
  }

  /**
   * Setup command line interface
   */
  private setupCLI(): void {
    this.program
      .name('mtg-card-filter')
      .description('Filter Magic: The Gathering cards from Scryfall JSON data')
      .version('1.0.0');

    // Filter command (default)
    this.program
      .command('filter')
      .description('Filter cards from database and output as JSON')
      .requiredOption('-i, --input <file>', 'Input text file containing card queries')
      .requiredOption('-d, --database <file>', 'JSON file containing Scryfall card data')
      .requiredOption('-o, --output <file>', 'Output JSON file for matched cards')
      .action((options) => {
        this.runFilter({
          inputFile: options.input,
          databaseFile: options.database,
          outputFile: options.output
        });
      });

    // Export command
    this.program
      .command('export')
      .description('Export cards from text list to markdown files')
      .requiredOption('-i, --input <file>', 'Input text file containing card queries')
      .requiredOption('-d, --database <file>', 'JSON file containing Scryfall card data')
      .requiredOption('-o, --output <directory>', 'Output directory for markdown files')
      .action((options) => {
        this.runExport({
          input: options.input,
          database: options.database,
          output: options.output
        });
      });

    // Fallback to filter command if no command specified
    if (process.argv.length > 2 && process.argv[2] && !['filter', 'export', '--help', '-h', '--version', '-V'].includes(process.argv[2])) {
      // Old-style direct options, treat as filter command
      this.program
        .requiredOption('-i, --input <file>', 'Input text file containing card queries')
        .requiredOption('-d, --database <file>', 'JSON file containing Scryfall card data')
        .requiredOption('-o, --output <file>', 'Output JSON file for matched cards')
        .action((options) => {
          this.runFilter({
            inputFile: options.input,
            databaseFile: options.database,
            outputFile: options.output
          });
        });
    }

    this.program.parse();
  }

  /**
   * Run the card filtering operation
   */
  private async runFilter(options: FilterOptions): Promise<void> {
    try {
      const startTime = Date.now();

      console.log('MTG Card Filter Tool v1.0.0');
      console.log('==============================\n');

      // Validate input files exist
      this.validateFiles(options);

      // Parse input file
      const parser = new CardListParser();
      const queries = parser.parseFile(options.inputFile);

      // Load database
      const database = new CardDatabase();
      database.loadFromFile(options.databaseFile);

      // Find matches
      const matchResult = database.findMatches(queries);

      // Write output
      const writer = new OutputWriter();
      writer.writeToFile(matchResult, options.outputFile);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Summary
      console.log('\n' + '='.repeat(50));
      console.log('SUMMARY');
      console.log('='.repeat(50));
      console.log(`Processed ${queries.length} queries`);
      console.log(`Found ${matchResult.matches.length} matches`);
      console.log(`${matchResult.unmatched.length} unmatched queries`);
      console.log(`Processing time: ${duration}ms`);

      if (matchResult.unmatched.length > 0) {
        console.log('\nUnmatched queries:');
        matchResult.unmatched.forEach(query => {
          console.log(`  ${query.name} [${query.set}]`);
        });
      }

      console.log(`\nResults written to: ${path.resolve(options.outputFile)}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Run the markdown export operation
   */
  private async runExport(options: ExportOptions): Promise<void> {
    try {
      const startTime = Date.now();

      console.log('MTG Card Export Tool v1.0.0');
      console.log('==============================\n');

      // Validate input files exist
      this.validateExportFiles(options);

      // Parse input file
      const parser = new CardListParser();
      const queries = parser.parseFile(options.input);

      // Load database
      const database = new CardDatabase();
      database.loadFromFile(options.database);

      // Find matches
      const matchResult = database.findMatches(queries);

      // Export to markdown
      const markdownWriter = new MarkdownWriter();
      markdownWriter.writeCardsToMarkdown(matchResult.matches.map(m => m.card), {
        outputDirectory: options.output
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Summary
      console.log('\n' + '='.repeat(50));
      console.log('EXPORT SUMMARY');
      console.log('='.repeat(50));
      console.log(`Processed ${queries.length} queries`);
      console.log(`Found ${matchResult.matches.length} matches`);
      console.log(`Exported ${matchResult.matches.length} cards to markdown`);
      console.log(`${matchResult.unmatched.length} unmatched queries`);
      console.log(`Processing time: ${duration}ms`);

      if (matchResult.unmatched.length > 0) {
        console.log('\nUnmatched queries:');
        matchResult.unmatched.forEach(query => {
          console.log(`  ${query.name} [${query.set}]`);
        });
      }

      console.log(`\nMarkdown files written to: ${path.resolve(options.output)}`);

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Validate that required files exist
   */
  private validateFiles(options: FilterOptions): void {
    const fs = require('fs');

    if (!fs.existsSync(options.inputFile)) {
      throw new Error(`Input file not found: ${options.inputFile}`);
    }

    if (!fs.existsSync(options.databaseFile)) {
      throw new Error(`Database file not found: ${options.databaseFile}`);
    }

    // Validate file extensions
    if (!options.inputFile.toLowerCase().endsWith('.txt')) {
      console.warn('Warning: Input file should have .txt extension');
    }

    if (!options.databaseFile.toLowerCase().endsWith('.json')) {
      console.warn('Warning: Database file should have .json extension');
    }

    if (!options.outputFile.toLowerCase().endsWith('.json')) {
      console.warn('Warning: Output file should have .json extension');
    }
  }

  /**
   * Validate that required files exist for export
   */
  private validateExportFiles(options: ExportOptions): void {
    const fs = require('fs');

    if (!fs.existsSync(options.input)) {
      throw new Error(`Input file not found: ${options.input}`);
    }

    if (!fs.existsSync(options.database)) {
      throw new Error(`Database file not found: ${options.database}`);
    }

    // Validate file extensions
    if (!options.input.toLowerCase().endsWith('.txt')) {
      console.warn('Warning: Input file should have .txt extension');
    }

    if (!options.database.toLowerCase().endsWith('.json')) {
      console.warn('Warning: Database file should have .json extension');
    }

    // Validate output is a directory path (not a file)
    if (options.output.toLowerCase().endsWith('.md') || options.output.toLowerCase().endsWith('.json')) {
      console.warn('Warning: Output should be a directory path, not a file');
    }
  }
}

// Start the application
if (require.main === module) {
  new CardFilterTool();
}