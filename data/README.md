# Sample Data Files

This directory contains sample data files for testing the MTG Card Filter Tool.

## Files

### Input Files
- **`sample-input.txt`** - Basic example showing the input format with various MTG cards
- **`test-edge-cases.txt`** - Edge cases including case-insensitive matching, empty lines, and invalid cards

### Database Files
- **`sample-cards.json`** - Small sample database with 3 Scryfall card objects for testing

### Output Files
- **`matched-cards.json`** - Results from running the sample input
- **`edge-case-results.json`** - Results from the edge case test

## Usage Examples

Basic usage:
```bash
npm run filter -- --input data/sample-input.txt --database data/sample-cards.json --output data/output.json
```

Edge case testing:
```bash
npm run filter -- --input data/test-edge-cases.txt --database data/sample-cards.json --output data/edge-output.json
```

## Input Format

The input files use the format:
```
Card Name [SET]
```

Where:
- `Card Name` is the exact name of the Magic card
- `SET` is the three-letter set code (case-insensitive)
- Lines starting with `#` are comments
- Empty lines are ignored

## Expected Results

From `sample-input.txt`:
- **Matches**: Lightning Bolt [LEA], Green Dragon [AFR], Counterspell [2ED]
- **Unmatched**: Black Lotus [LEA], Ancestral Recall [LEA], Red Dragon [AFR], Blue Dragon [AFR]

From `test-edge-cases.txt`:
- **Matches**: All Lightning Bolt variants, green dragon [afr], COUNTERSPELL [2ED]
- **Unmatched**: Nonexistent Card [FAKE]