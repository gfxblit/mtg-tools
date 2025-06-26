import { ScryfallCard } from '../types/scryfall';

/**
 * Configuration for markdown sections
 */
interface MarkdownSection {
  title: string;
  fields: MarkdownField[];
  condition?: (card: ScryfallCard) => boolean;
}

interface MarkdownField {
  label: string;
  property: string | ((card: ScryfallCard) => string | undefined);
  formatter?: (value: any) => string;
  condition?: (card: ScryfallCard) => boolean;
}

/**
 * Service for generating markdown content from MTG cards
 */
export class MarkdownGenerator {
  private readonly sectionMap: MarkdownSection[] = [
    {
      title: 'Card Details',
      fields: [
        {
          label: 'Mana Cost',
          property: 'mana_cost',
          formatter: this.formatManaSymbols.bind(this),
          condition: (card) => !!card.mana_cost
        },
        {
          label: 'Type',
          property: 'type_line'
        },
        {
          label: 'Set',
          property: (card) => `${card.set_name} (${card.set.toUpperCase()})`
        },
        {
          label: 'Rarity',
          property: 'rarity',
          formatter: this.capitalize.bind(this)
        },
        {
          label: 'Power/Toughness',
          property: (card) => card.power && card.toughness ? `${card.power}/${card.toughness}` : undefined,
          condition: (card) => !!(card.power && card.toughness)
        },
        {
          label: 'Loyalty',
          property: 'loyalty',
          condition: (card) => !!card.loyalty
        }
      ]
    },
    {
      title: 'Oracle Text',
      fields: [
        {
          label: '',
          property: 'oracle_text',
          formatter: this.formatOracleText.bind(this)
        }
      ],
      condition: (card) => !!card.oracle_text
    },
    {
      title: 'Flavor Text',
      fields: [
        {
          label: '',
          property: 'flavor_text',
          formatter: (text) => `*${text}*`
        }
      ],
      condition: (card) => !!card.flavor_text
    },
    {
      title: 'Additional Information',
      fields: [
        {
          label: 'Converted Mana Cost',
          property: 'cmc',
          condition: (card) => card.cmc !== undefined
        },
        {
          label: 'Colors',
          property: (card) => card.colors && card.colors.length > 0 ? card.colors.join(', ') : undefined,
          condition: (card) => !!(card.colors && card.colors.length > 0)
        },
        {
          label: 'Color Identity',
          property: (card) => card.color_identity && card.color_identity.length > 0 ? card.color_identity.join(', ') : undefined,
          condition: (card) => !!(card.color_identity && card.color_identity.length > 0)
        },
        {
          label: 'Released',
          property: 'released_at'
        },
        {
          label: 'Artist',
          property: 'artist',
          condition: (card) => !!card.artist
        },
        {
          label: 'Collector Number',
          property: 'collector_number'
        }
      ]
    },
    {
      title: 'Pricing',
      fields: [
        {
          label: 'USD',
          property: (card) => card.prices?.usd ? `$${card.prices.usd}` : undefined,
          condition: (card) => !!card.prices?.usd
        },
        {
          label: 'USD Foil',
          property: (card) => card.prices?.usd_foil ? `$${card.prices.usd_foil}` : undefined,
          condition: (card) => !!card.prices?.usd_foil
        },
        {
          label: 'EUR',
          property: (card) => card.prices?.eur ? `€${card.prices.eur}` : undefined,
          condition: (card) => !!card.prices?.eur
        },
        {
          label: 'MTGO',
          property: (card) => card.prices?.tix ? `${card.prices.tix} tix` : undefined,
          condition: (card) => !!card.prices?.tix
        }
      ],
      condition: (card) => !!(card.prices && (card.prices.usd || card.prices.usd_foil || card.prices.eur || card.prices.tix))
    },
    {
      title: 'Links',
      fields: [
        {
          label: 'Scryfall',
          property: (card) => `[View on Scryfall](${card.scryfall_uri})`
        },
        {
          label: 'Gatherer',
          property: (card) => card.related_uris?.gatherer ? `[View on Gatherer](${card.related_uris.gatherer})` : undefined,
          condition: (card) => !!card.related_uris?.gatherer
        }
      ]
    }
  ];

  /**
   * Generate markdown content for a single card using the section map
   */
  public generateCardMarkdown(card: ScryfallCard): string {
    const sections: string[] = [];

    // YAML frontmatter
    const frontmatter = this.generateYamlFrontmatter(card);
    sections.push(frontmatter);
    sections.push('');

    // Title
    sections.push(`# ${card.name}`);
    sections.push('');

    // Generate sections based on the map
    for (const section of this.sectionMap) {
      // Check if section should be included
      if (section.condition && !section.condition(card)) {
        continue;
      }

      // Generate section content
      const sectionContent = this.generateSection(card, section);
      if (sectionContent.length > 0) {
        sections.push(`## ${section.title}`);
        sections.push('');
        sections.push(...sectionContent);
        sections.push('');
      }
    }

    sections.push('---');
    sections.push('');

    return sections.join('\n');
  }

  /**
   * Generate content for a specific section
   */
  private generateSection(card: ScryfallCard, section: MarkdownSection): string[] {
    const content: string[] = [];

    for (const field of section.fields) {
      // Check field condition
      if (field.condition && !field.condition(card)) {
        continue;
      }

      // Get field value
      let value: any;
      if (typeof field.property === 'function') {
        value = field.property(card);
      } else {
        value = this.getNestedProperty(card, field.property);
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Apply formatter if provided
      if (field.formatter) {
        value = field.formatter(value);
      }

      // Add to content
      if (field.label) {
        content.push(`**${field.label}:** ${value}`);
      } else {
        content.push(value);
      }
    }

    return content;
  }

  /**
   * Get nested property from object using dot notation
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Generate an index markdown file for multiple cards
   */
  public generateIndexMarkdown(cards: ScryfallCard[]): string {
    const sections: string[] = [];

    sections.push('# MTG Card Collection');
    sections.push('');
    sections.push(`This collection contains ${cards.length} cards.`);
    sections.push('');

    // Group by set
    const cardsBySet = this.groupCardsBySet(cards);
    
    sections.push('## Cards by Set');
    sections.push('');

    for (const [setCode, setCards] of Object.entries(cardsBySet)) {
      const setName = setCards[0]?.set_name || 'Unknown Set';
      sections.push(`### ${setName} (${setCode.toUpperCase()})`);
      sections.push('');
      
      for (const card of setCards) {
        const filename = this.sanitizeFilename(card.name);
        sections.push(`- [${card.name}](./${filename}.md) - ${card.type_line}`);
      }
      sections.push('');
    }

    // Summary statistics
    sections.push('## Collection Statistics');
    sections.push('');
    
    const sets = Object.keys(cardsBySet);
    sections.push(`**Total Sets:** ${sets.length}`);
    sections.push(`**Total Cards:** ${cards.length}`);
    
    const rarities = this.countByRarity(cards);
    sections.push('');
    sections.push('**By Rarity:**');
    for (const [rarity, count] of Object.entries(rarities)) {
      sections.push(`- ${this.capitalize(rarity)}: ${count}`);
    }

    const colors = this.countByColors(cards);
    sections.push('');
    sections.push('**By Color Identity:**');
    for (const [color, count] of Object.entries(colors)) {
      sections.push(`- ${color}: ${count}`);
    }

    return sections.join('\n');
  }

  /**
   * Generate YAML frontmatter for a card
   */
  private generateYamlFrontmatter(card: ScryfallCard): string {
    const tags = this.extractTagsFromTypeLine(card.type_line);
    const frontmatter: string[] = [];
    
    frontmatter.push('---');
    frontmatter.push(`title: "${card.name}"`);
    frontmatter.push(`tags:`);
    
    for (const tag of tags) {
      frontmatter.push(`  - ${tag}`);
    }
    
    frontmatter.push('---');
    
    return frontmatter.join('\n');
  }

  /**
   * Extract tags from type line field
   */
  private extractTagsFromTypeLine(typeLine: string): string[] {
    if (!typeLine) {
      return [];
    }

    // Split by common delimiters and clean up
    const words = typeLine
      .toLowerCase()
      .replace(/[—–-]/g, ' ') // Replace em-dash, en-dash, hyphen with space
      .replace(/[^\w\s]/g, '') // Remove punctuation except word characters and spaces
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 0); // Remove empty strings

    // Create tags from cleaned words
    const tags: string[] = [];
    
    for (const word of words) {
      // Skip common articles and prepositions
      if (!['the', 'a', 'an', 'of', 'and', 'or'].includes(word)) {
        tags.push(word);
      }
    }

    // Remove duplicates and sort
    const uniqueTags = Array.from(new Set(tags));
    uniqueTags.sort();

    return uniqueTags;
  }

  /**
   * Format mana symbols for markdown
   */
  private formatManaSymbols(manaCost: string): string {
    return manaCost
      .replace(/{W}/g, '⚪') // White
      .replace(/{U}/g, '🔵') // Blue
      .replace(/{B}/g, '⚫') // Black
      .replace(/{R}/g, '🔴') // Red
      .replace(/{G}/g, '🟢') // Green
      .replace(/{C}/g, '◇')  // Colorless
      .replace(/{(\d+)}/g, '($1)') // Numbers
      .replace(/{X}/g, '(X)')
      .replace(/{T}/g, '⤵️') // Tap
      .replace(/{Q}/g, '⤴️'); // Untap
  }

  /**
   * Format oracle text for markdown
   */
  private formatOracleText(text: string): string {
    return text
      .replace(/\n/g, '\n\n') // Double line breaks for paragraphs
      .replace(/{([^}]+)}/g, (match, symbol) => {
        // Format mana symbols in oracle text
        return this.formatManaSymbols(match);
      });
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Group cards by set
   */
  private groupCardsBySet(cards: ScryfallCard[]): Record<string, ScryfallCard[]> {
    return cards.reduce((groups, card) => {
      const setCode = card.set;
      if (!groups[setCode]) {
        groups[setCode] = [];
      }
      groups[setCode].push(card);
      return groups;
    }, {} as Record<string, ScryfallCard[]>);
  }

  /**
   * Count cards by rarity
   */
  private countByRarity(cards: ScryfallCard[]): Record<string, number> {
    return cards.reduce((counts, card) => {
      const rarity = card.rarity;
      counts[rarity] = (counts[rarity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Count cards by color identity
   */
  private countByColors(cards: ScryfallCard[]): Record<string, number> {
    return cards.reduce((counts, card) => {
      const colors = card.color_identity || [];
      const colorKey = colors.length === 0 ? 'Colorless' :
                      colors.length === 1 ? colors[0] || 'Unknown' :
                      colors.sort().join('');
      if (colorKey) {
        counts[colorKey] = (counts[colorKey] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Sanitize filename for filesystem
   */
  public sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}