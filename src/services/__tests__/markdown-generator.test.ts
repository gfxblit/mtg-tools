import { MarkdownGenerator } from '../markdown-generator';
import { ScryfallCard } from '../../types/scryfall';

describe('MarkdownGenerator', () => {
  let generator: MarkdownGenerator;
  
  const mockCard: ScryfallCard = {
    id: '1',
    name: 'Lightning Bolt',
    type_line: 'Instant',
    mana_cost: '{R}',
    colors: ['R'],
    oracle_text: 'Lightning Bolt deals 3 damage to any target.',
    set: 'lea',
    set_name: 'Limited Edition Alpha',
    rarity: 'common',
    released_at: '1993-08-05',
    scryfall_uri: 'https://scryfall.com/card/lea/161/lightning-bolt',
    collector_number: '161',
    keywords: ['Instant'],
    cmc: 1
  } as ScryfallCard;

  beforeEach(() => {
    generator = new MarkdownGenerator();
  });

  describe('extractColorTags', () => {
    it('should extract single color tags', () => {
      const redCard = { ...mockCard, colors: ['R'] };
      const markdown = generator.generateCardMarkdown(redCard);
      
      expect(markdown).toContain('  - red');
    });

    it('should extract multiple color tags', () => {
      const multiColorCard = { ...mockCard, colors: ['W', 'U'] };
      const markdown = generator.generateCardMarkdown(multiColorCard);
      
      expect(markdown).toContain('  - blue');
      expect(markdown).toContain('  - white');
    });

    it('should add colorless tag for cards with no colors', () => {
      const colorlessCard = { ...mockCard, colors: [] };
      const markdown = generator.generateCardMarkdown(colorlessCard);
      
      expect(markdown).toContain('  - colorless');
    });

    it('should add undefined-color tag for cards with undefined colors', () => {
      const undefinedColorsCard = { ...mockCard };
      delete (undefinedColorsCard as any).colors;
      const markdown = generator.generateCardMarkdown(undefinedColorsCard);
      
      expect(markdown).toContain('  - undefined-color');
    });

    it('should handle all MTG colors', () => {
      const allColorsCard = { ...mockCard, colors: ['W', 'U', 'B', 'R', 'G'] };
      const markdown = generator.generateCardMarkdown(allColorsCard);
      
      expect(markdown).toContain('  - black');
      expect(markdown).toContain('  - blue');
      expect(markdown).toContain('  - green');
      expect(markdown).toContain('  - red');
      expect(markdown).toContain('  - white');
    });
  });

  describe('generateCardMarkdown integration', () => {
    it('should include color tags in YAML frontmatter', () => {
      const markdown = generator.generateCardMarkdown(mockCard);
      
      // Should have YAML frontmatter structure
      expect(markdown).toMatch(/^---\n/);
      expect(markdown).toContain('title: "Lightning Bolt"');
      expect(markdown).toContain('tags:');
      expect(markdown).toContain('  - red');
      expect(markdown).toContain('  - instant');
      
      // Should close frontmatter
      const lines = markdown.split('\n');
      const firstYamlEnd = lines.findIndex((line, index) => index > 0 && line === '---');
      expect(firstYamlEnd).toBeGreaterThan(0);
    });

    it('should combine color tags with type and keyword tags', () => {
      const complexCard = {
        ...mockCard,
        colors: ['U', 'R'],
        type_line: 'Instant — Arcane',
        keywords: ['Flash', 'Storm']
      };
      
      const markdown = generator.generateCardMarkdown(complexCard);
      
      // Should contain color tags
      expect(markdown).toContain('  - blue');
      expect(markdown).toContain('  - red');
      
      // Should contain type tags
      expect(markdown).toContain('  - arcane');
      expect(markdown).toContain('  - instant');
      
      // Should contain keyword tags
      expect(markdown).toContain('  - flash');
      expect(markdown).toContain('  - storm');
    });

    it('should deduplicate tags correctly', () => {
      const cardWithDuplicates = {
        ...mockCard,
        colors: ['R'],
        type_line: 'Instant',
        keywords: ['Instant'] // Duplicate with type_line
      };
      
      const markdown = generator.generateCardMarkdown(cardWithDuplicates);
      const instantMatches = (markdown.match(/  - instant/g) || []).length;
      
      // Should only appear once despite being in both type_line and keywords
      expect(instantMatches).toBe(1);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize card names for filesystem', () => {
      expect(generator.sanitizeFilename('Jace, the Mind Sculptor')).toBe('jace-the-mind-sculptor');
      expect(generator.sanitizeFilename("Serra's Angel")).toBe('serras-angel');
      expect(generator.sanitizeFilename('Lim-Dûl\'s Vault')).toBe('lim-dls-vault');
    });
  });
});