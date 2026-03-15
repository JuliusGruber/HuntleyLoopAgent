# AGENTS.md — Operational Guide

## Source Directories

- Main source: `ralphLoop/src/`

## Build & Run

```bash
# Install dependencies
npm install

# Build
npx tsc

# Run
npx tsx ralphLoop/src/index.ts
```

## Validation

```bash
# Type checking
npx tsc --noEmit

# Linting (if eslint is available)
npx eslint ralphLoop/src/ || true
```

## Operational Notes

## Codebase Patterns

- Language: TypeScript
- Dependencies managed via npm (`package.json`)
- Uses the Anthropic SDK (`@anthropic-ai/sdk`)
- One concern per file
