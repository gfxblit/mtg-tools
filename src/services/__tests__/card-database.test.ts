import * as fs from 'fs';
import { CardDatabase } from '../card-database';
import { ScryfallCard } from '../../types/scryfall';
import { CardQuery } from '../../types/card-query';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('CardDatabase', () => {
  let database: CardDatabase;
  const mockCards: ScryfallCard[] = [
    {
      id: '1',
      name: 'Lightning Bolt',
      set: 'lea',
      released_at: '1993-08-05',
      type_line: 'Instant',
      mana_cost: '{R}',
      oracle_text: 'Lightning Bolt deals 3 damage to any target.',
      collector_number: '161'
    } as ScryfallCard,
    {
      id: '2',
      name: 'Lightning Bolt',
      set: 'm20',
      released_at: '2019-07-12',
      type_line: 'Instant',
      mana_cost: '{R}',
      oracle_text: 'Lightning Bolt deals 3 damage to any target.',
      collector_number: '154'
    } as ScryfallCard,
    {
      id: '3',
      name: 'Counterspell',
      set: 'lea',
      released_at: '1993-08-05',
      type_line: 'Instant',
      mana_cost: '{U}{U}',
      oracle_text: 'Counter target spell.',
      collector_number: '55'
    } as ScryfallCard
  ];

  beforeEach(() => {
    database = new CardDatabase();
    jest.clearAllMocks();
  });

  describe('loadFromFile', () => {
    it('should throw error if file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      expect(() => database.loadFromFile('nonexistent.json')).toThrow('Database file not found: nonexistent.json');
    });

    it('should throw error for invalid JSON', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('invalid json');

      expect(() => database.loadFromFile('invalid.json')).toThrow('Invalid JSON in database file:');
    });

    it('should throw error if JSON is not an array', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue('{"not": "array"}');

      expect(() => database.loadFromFile('invalid.json')).toThrow('Database file must contain an array of card objects');
    });

    it('should load valid card data', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockCards));

      database.loadFromFile('cards.json');

      expect(database.getCardCount()).toBe(3);
      expect(database.getCards()).toHaveLength(3);
    });
  });

  describe('findMatches', () => {
    beforeEach(() => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockCards));
      database.loadFromFile('cards.json');
    });

    it('should find exact matches', () => {
      const queries: CardQuery[] = [
        { name: 'Lightning Bolt', set: 'LEA', originalLine: 'Lightning Bolt [LEA]', lineNumber: 1 }
      ];

      const result = database.findMatches(queries);

      expect(result.matches).toHaveLength(1);
      expect(result.unmatched).toHaveLength(0);
      expect(result.matches[0]!.matchType).toBe('exact');
      expect(result.matches[0]!.card.name).toBe('Lightning Bolt');
      expect(result.matches[0]!.card.set).toBe('lea');
    });

    it('should find fallback matches when set does not match', () => {
      const queries: CardQuery[] = [
        { name: 'Lightning Bolt', set: 'UNKNOWN', originalLine: 'Lightning Bolt [UNKNOWN]', lineNumber: 1 }
      ];

      const result = database.findMatches(queries);

      expect(result.matches).toHaveLength(1);
      expect(result.unmatched).toHaveLength(0);
      expect(result.matches[0]!.matchType).toBe('fallback');
      expect(result.matches[0]!.card.name).toBe('Lightning Bolt');
      expect(result.matches[0]!.card.set).toBe('m20'); // Most recent
    });

    it('should return unmatched for cards not in database', () => {
      const queries: CardQuery[] = [
        { name: 'Unknown Card', set: 'UNKNOWN', originalLine: 'Unknown Card [UNKNOWN]', lineNumber: 1 }
      ];

      const result = database.findMatches(queries);

      expect(result.matches).toHaveLength(0);
      expect(result.unmatched).toHaveLength(1);
      expect(result.unmatched[0]!.name).toBe('Unknown Card');
    });

    it('should handle mixed match types', () => {
      const queries: CardQuery[] = [
        { name: 'Lightning Bolt', set: 'LEA', originalLine: 'Lightning Bolt [LEA]', lineNumber: 1 },
        { name: 'Counterspell', set: 'UNKNOWN', originalLine: 'Counterspell [UNKNOWN]', lineNumber: 2 },
        { name: 'Unknown Card', set: 'UNKNOWN', originalLine: 'Unknown Card [UNKNOWN]', lineNumber: 3 }
      ];

      const result = database.findMatches(queries);

      expect(result.matches).toHaveLength(2);
      expect(result.unmatched).toHaveLength(1);
      expect(result.matches[0]!.matchType).toBe('exact');
      expect(result.matches[1]!.matchType).toBe('fallback');
    });
  });

  describe('getCards', () => {
    it('should return copy of cards array', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockCards));
      database.loadFromFile('cards.json');

      const cards = database.getCards();
      expect(cards).toHaveLength(3);
      expect(cards).not.toBe(database.getCards()); // Should be different instances
    });
  });

  describe('getCardCount', () => {
    it('should return correct count', () => {
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockCards));
      database.loadFromFile('cards.json');

      expect(database.getCardCount()).toBe(3);
    });

    it('should return 0 for empty database', () => {
      expect(database.getCardCount()).toBe(0);
    });
  });
});