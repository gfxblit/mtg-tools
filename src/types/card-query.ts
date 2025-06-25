/**
 * Represents a card query parsed from the input file
 */
export interface CardQuery {
  /** The card name to search for */
  name: string;
  
  /** The set code to match against */
  set: string;
  
  /** The original line from the input file for error reporting */
  originalLine: string;
  
  /** Line number in the input file for error reporting */
  lineNumber: number;
}

/**
 * Result of matching queries against the database
 */
export interface MatchResult {
  /** Cards that were successfully matched */
  matches: CardMatch[];
  
  /** Queries that didn't find any matches */
  unmatched: CardQuery[];
}

/**
 * Represents a successful match between a query and a card
 */
export interface CardMatch {
  /** The original query */
  query: CardQuery;
  
  /** The matched card from the database */
  card: import('./scryfall').ScryfallCard;
  
  /** The type of match found */
  matchType: 'exact' | 'fallback';
}

/**
 * Configuration options for the card filter tool
 */
export interface FilterOptions {
  /** Path to the input file containing card queries */
  inputFile: string;
  
  /** Path to the JSON database file */
  databaseFile: string;
  
  /** Path for the output file */
  outputFile: string;
}
