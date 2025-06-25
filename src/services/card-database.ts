import * as fs from 'fs';
import * as path from 'path';
import { ScryfallCard } from '../types/scryfall';
import { CardQuery, MatchResult, CardMatch } from '../types/card-query';
import { normalizeString } from '../utils/string-utils';

/**
 * Class for loading and searching card databases
 */
export class CardDatabase {
  private cards: ScryfallCard[] = [];
  private nameSetIndex: Map<string, ScryfallCard[]> = new Map();
  private nameOnlyIndex: Map<string, ScryfallCard[]> = new Map();

  /**
   * Load cards from a JSON file
   * @param filePath Path to the JSON file containing Scryfall card data
   */
  public loadFromFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Database file not found: ${filePath}`);
    }

    console.log(`Loading card database from ${path.basename(filePath)}...`);
    
    const content = fs.readFileSync(filePath, 'utf-8');
    let data: unknown;
    
    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in database file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (!Array.isArray(data)) {
      throw new Error('Database file must contain an array of card objects');
    }

    this.cards = data as ScryfallCard[];
    this.buildIndex();
    
    console.log(`Loaded ${this.cards.length} cards from database`);
  }

  /**
   * Find matching cards for the given queries
   * @param queries Array of card queries to match
   * @returns Match result containing matches and unmatched queries
   */
  public findMatches(queries: CardQuery[]): MatchResult {
    const matches: CardMatch[] = [];
    const unmatched: CardQuery[] = [];

    console.log(`Searching for ${queries.length} cards...`);

    for (const query of queries) {
      const exactKey = this.createIndexKey(query.name, query.set);
      const exactMatch = this.nameSetIndex.get(exactKey)?.[0];
      
      if (exactMatch) {
        // 1. Exact match found
        matches.push({
          query,
          card: exactMatch,
          matchType: 'exact'
        });
      } else {
        // 2. Try name-only fallback
        const nameKey = normalizeString(query.name);
        const fallbackCandidates = this.nameOnlyIndex.get(nameKey);
        
        if (fallbackCandidates && fallbackCandidates.length > 0) {
          const fallbackCard = this.getMostRecentCard(fallbackCandidates);
          matches.push({
            query,
            card: fallbackCard,
            matchType: 'fallback'
          });
          console.log(`  Fallback: ${query.name} [${query.set}] → found in [${fallbackCard.set.toUpperCase()}] (${fallbackCard.released_at})`);
        } else {
          // 3. Try partial name matching
          const partialMatch = this.findPartialMatch(query.name);
          if (partialMatch) {
            matches.push({
              query,
              card: partialMatch,
              matchType: 'fallback'
            });
            console.log(`  Partial match: ${query.name} [${query.set}] → found "${partialMatch.name}" in [${partialMatch.set.toUpperCase()}] (${partialMatch.released_at})`);
          } else {
            unmatched.push(query);
          }
        }
      }
    }

    const exactCount = matches.filter(m => m.matchType === 'exact').length;
    const fallbackCount = matches.filter(m => m.matchType === 'fallback').length;
    
    console.log(`Found ${exactCount} exact matches, ${fallbackCount} fallback matches, ${unmatched.length} unmatched`);
    
    if (unmatched.length > 0) {
      console.warn('Unmatched queries:');
      unmatched.forEach(query => {
        console.warn(`  Line ${query.lineNumber}: ${query.name} [${query.set}]`);
      });
    }

    return {
      matches,
      unmatched
    };
  }

  /**
   * Get all loaded cards
   */
  public getCards(): ScryfallCard[] {
    return [...this.cards];
  }

  /**
   * Get the number of loaded cards
   */
  public getCardCount(): number {
    return this.cards.length;
  }

  /**
   * Build an index for fast lookups
   */
  private buildIndex(): void {
    console.log('Building search index...');
    this.nameSetIndex.clear();
    this.nameOnlyIndex.clear();

    for (const card of this.cards) {
      // Existing exact match index
      const exactKey = this.createIndexKey(card.name, card.set);
      
      if (!this.nameSetIndex.has(exactKey)) {
        this.nameSetIndex.set(exactKey, []);
      }
      
      this.nameSetIndex.get(exactKey)!.push(card);

      // New: Name-only index for fallback
      const nameKey = normalizeString(card.name);
      if (!this.nameOnlyIndex.has(nameKey)) {
        this.nameOnlyIndex.set(nameKey, []);
      }
      this.nameOnlyIndex.get(nameKey)!.push(card);
    }

    console.log(`Index built with ${this.nameSetIndex.size} exact matches and ${this.nameOnlyIndex.size} unique card names`);
  }

  /**
   * Find a card matching the query
   * @param query The card query to match
   * @returns Matching card or null if not found
   */
  private findCard(query: CardQuery): ScryfallCard | null {
    // 1. Try exact match first (existing behavior)
    const exactKey = this.createIndexKey(query.name, query.set);
    const exactCandidates = this.nameSetIndex.get(exactKey);
    
    if (exactCandidates && exactCandidates.length > 0) {
      return exactCandidates[0] || null; // Return first exact match
    }

    // 2. Fallback to name-only match
    const nameKey = normalizeString(query.name);
    const fallbackCandidates = this.nameOnlyIndex.get(nameKey);
    
    if (!fallbackCandidates || fallbackCandidates.length === 0) {
      return null; // No matches found
    }

    // 3. Return most recent printing
    return this.getMostRecentCard(fallbackCandidates);
  }

  /**
   * Get the most recent card from a list of candidates
   * @param cards Array of cards to sort
   * @returns The card with the most recent release date
   */
  private getMostRecentCard(cards: ScryfallCard[]): ScryfallCard {
    if (cards.length === 0) {
      throw new Error('Cannot get most recent card from empty array');
    }
    
    const sorted = cards.sort((a, b) => {
      // Sort by released_at date (most recent first)
      const dateA = a.released_at ? new Date(a.released_at) : new Date(0);
      const dateB = b.released_at ? new Date(b.released_at) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    return sorted[0]!;
  }

  /**
   * Find a partial match where the query name and card name have substring overlap
   * @param queryName The card name to search for
   * @returns The best matching card or null if not found
   */
  private findPartialMatch(queryName: string): ScryfallCard | null {
    const normalizedQuery = normalizeString(queryName);
    const candidates: ScryfallCard[] = [];

    // Search through all cards for partial matches
    for (const card of this.cards) {
      const normalizedCardName = normalizeString(card.name);
      
      // Skip if they're exactly the same (should have been caught earlier)
      if (normalizedQuery === normalizedCardName) {
        continue;
      }
      
      // Check if query name is a subset of card name (e.g., "Ballista Watcher" matches "Ballista Watcher // Ballista Wielder")
      // OR if card name is a subset of query name (e.g., "Arborea Pegasus" matches "Arborea Pegasus (Showcase)")
      if (normalizedCardName.includes(normalizedQuery) || normalizedQuery.includes(normalizedCardName)) {
        candidates.push(card);
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // Return the most recent match from candidates
    return this.getMostRecentCard(candidates);
  }

  /**
   * Create an index key from card name and set
   */
  private createIndexKey(name: string, set: string): string {
    return `${normalizeString(name)}|${normalizeString(set)}`;
  }
}