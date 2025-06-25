/**
 * Scryfall card object interface based on the Scryfall API documentation
 * This interface includes the most commonly used properties from Scryfall card objects
 */
export interface ScryfallCard {
  // Core identifiers
  object: string;
  id: string;
  oracle_id: string;
  multiverse_ids?: number[];
  mtgo_id?: number;
  arena_id?: number;
  tcgplayer_id?: number;
  cardmarket_id?: number;

  // Basic card information
  name: string;
  lang: string;
  released_at: string;
  uri: string;
  scryfall_uri: string;

  // Layout and visual
  layout: string;
  highres_image?: boolean;
  image_status: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
    art_crop?: string;
    border_crop?: string;
  };

  // Game mechanics
  mana_cost?: string;
  cmc?: number;
  type_line: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  colors?: string[];
  color_identity?: string[];
  keywords?: string[];

  // Legalities
  legalities: {
    standard?: string;
    future?: string;
    historic?: string;
    timeless?: string;
    gladiator?: string;
    pioneer?: string;
    explorer?: string;
    modern?: string;
    legacy?: string;
    pauper?: string;
    vintage?: string;
    penny?: string;
    commander?: string;
    oathbreaker?: string;
    standardbrawl?: string;
    brawl?: string;
    alchemy?: string;
    paupercommander?: string;
    duel?: string;
    oldschool?: string;
    premodern?: string;
    predh?: string;
  };

  // Availability
  games: string[];
  reserved: boolean;
  foil: boolean;
  nonfoil: boolean;
  finishes?: string[];
  oversized: boolean;
  promo: boolean;
  reprint: boolean;
  variation: boolean;

  // Set information
  set_id: string;
  set: string;
  set_name: string;
  set_type: string;
  set_uri: string;
  set_search_uri: string;
  scryfall_set_uri: string;
  rulings_uri: string;
  prints_search_uri: string;

  // Card specifics
  collector_number: string;
  digital: boolean;
  rarity: string;
  flavor_text?: string;
  card_back_id: string;
  artist?: string;
  artist_ids?: string[];
  illustration_id?: string;
  border_color: string;
  frame: string;
  full_art: boolean;
  textless: boolean;
  booster: boolean;
  story_spotlight: boolean;

  // Rankings and preview
  edhrec_rank?: number;
  penny_rank?: number;
  preview?: {
    source: string;
    source_uri: string;
    previewed_at: string;
  };

  // Pricing
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
    usd_etched?: string | null;
    eur?: string | null;
    eur_foil?: string | null;
    tix?: string | null;
  };

  // Related URIs
  related_uris?: {
    gatherer?: string;
    tcgplayer_infinite_articles?: string;
    tcgplayer_infinite_decks?: string;
    edhrec?: string;
  };

  // Purchase URIs
  purchase_uris?: {
    tcgplayer?: string;
    cardmarket?: string;
    cardhoarder?: string;
  };

  // Allow additional properties for flexibility
  [key: string]: any;
}

/**
 * Array of Scryfall cards (typical format for JSON database files)
 */
export type ScryfallCardDatabase = ScryfallCard[];