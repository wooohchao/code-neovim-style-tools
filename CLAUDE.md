# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Code Telescope is a VS Code extension that brings Neovim Telescope-inspired fuzzy finding to VS Code. It provides a keyboard-first navigation interface for files, text, symbols, git branches/commits, and more.

## Development Commands

```bash
# Development (watch mode)
pnpm backend:watch          # Watch backend TypeScript compilation
pnpm webview:dev:watch      # Watch frontend webview build

# Build
pnpm build                  # Full production build (webview + backend)
pnpm backend:bundle:prod    # Production backend bundle
pnpm webview:prod           # Production webview build

# Linting & Formatting (Biome)
pnpm check                  # Check code issues
pnpm check:write            # Auto-fix code issues
pnpm format:write           # Format code

# Testing
pnpm test:unit              # Run unit tests (Vitest)
pnpm test:unit:watch        # Watch mode for unit tests
pnpm test:unit:cov          # Run tests with coverage
pnpm test:integration       # Run integration tests (requires xvfb-run on Linux)

# Packaging
pnpm make:package           # Build and package as .vsix
```

## Architecture

The extension follows a **three-layer architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Extension Host)                   │
│  - Finder Providers (@FuzzyFinderAdapter decorator)         │
│  - Message Handlers (@WebviewMessageHandler decorator)      │
│  - VS Code API access, Node.js runtime                      │
└────────────────────────┬────────────────────────────────────┘
                         │ Type-safe Message Protocol
┌────────────────────────┴────────────────────────────────────┐
│                      Webview (UI)                            │
│  - Data Adapters (@FuzzyDataAdapter decorator)              │
│  - Preview Renderers (@PreviewRendererAdapter decorator)    │
│  - Browser runtime, DOM manipulation                        │
└─────────────────────────────────────────────────────────────┘
```

### Key Directories

- `backend/` - Extension host code (Node.js)
  - `core/finders/` - Built-in finder implementations
  - `core/presentation/handlers/` - Webview message handlers
  - `core/decorators/` - Adapter decorators
  - `core/registry/` - Provider and handler registries
  - `integration/api/` - Public API for third-party extensions

- `ui/` - Webview frontend code (Browser)
  - `core/adapters/data/` - Data adapters for each finder type
  - `core/adapters/preview-renderer/` - Preview rendering adapters
  - `core/algos/` - Fuzzy matching algorithms (subsequence, substring)

- `shared/` - Shared type definitions
  - `abstractions/` - Interface definitions (IFuzzyFinderProvider, IFuzzyFinderDataAdapter)
  - `exchange/` - Message protocol types for each finder

### Core Patterns

1. **Decorator-based Registration**: Finders and handlers are registered via decorators, not manual wiring:
   ```typescript
   @FuzzyFinderAdapter({
     fuzzy: "workspace.files",
     previewRenderer: "preview.buffer",
   })
   export class WorkspaceFileProvider implements IFuzzyFinderProvider { ... }
   ```

2. **Provider Interface**: Each finder implements `IFuzzyFinderProvider`:
   - `querySelectableOptions()` - Fetch data on panel open
   - `onSelect(item)` - Handle user selection
   - `getPreviewData(identifier)` - Provide preview content
   - `supportsDynamicSearch` / `searchOnDynamicMode(query)` - Optional server-side filtering

3. **Data Adapter Interface**: UI-side adapters implement `IFuzzyFinderDataAdapter`:
   - `parseOptions(data)` - Transform backend data
   - `getSearchText(option)` - Text for fuzzy matching
   - `getSelectionValue(option)` - Identifier passed to backend
   - `getHtmlWrapper(option, highlighted)` - Render list item (or use `htmlWrapperPreset`)

### Dynamic Search

For large datasets (e.g., workspace text search), providers can enable dynamic search:

```typescript
export class WorkspaceTextSearchProvider implements IFuzzyFinderProvider {
  supportsDynamicSearch = true;
  async searchOnDynamicMode(query: string): Promise<any> { ... }
}
```

This sends queries to the backend for server-side filtering instead of local filtering.

## Testing

- Unit tests use **Vitest** with separate projects for `backend` (Node environment) and `ui` (jsdom)
- Integration tests use **@vscode/test-electron**
- Test files follow `*.test.ts` naming convention
- Backend tests: `backend/**/*.test.ts`
- UI tests: `ui/**/*.test.ts`

## Custom Finders

Users can create custom finders by placing `.cjs` files in `.vscode/code-telescope/`. See `examples/custom-json.finder.cjs` for a complete example.

Third-party extensions can register finders programmatically via the Extension API (`backend/integration/api/`).

## Code Style

- **Formatter/Linter**: Biome (replaces ESLint + Prettier)
- **Indentation**: 2 spaces
- **Line width**: 120 characters
- **Quotes**: Double quotes
- **Semicolons**: Always
- Pre-commit hooks via Husky + lint-staged auto-fix issues
