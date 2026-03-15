# AGENTS.md — Operational Guide

## Source Directories

- Main source: project root (Go source files at top level or in `cmd/`, `internal/`)

## Build & Run

```bash
# Build
go build ./...

# Run
go run .
```

## Validation

```bash
# Tests
go test ./...

# Type checking / vet
go vet ./...

# Linting (if golangci-lint is available)
golangci-lint run || true
```

## Operational Notes

## Codebase Patterns

- Language: Go
- Dependencies managed via Go modules (`go.mod`)
- Uses the Anthropic SDK for Go
- Standard Go project layout
- One concern per file
