.PHONY: build test

CURSOR ?= cursor

build:
	pnpm clean && pnpm build && vsce package --no-dependencies

test:
	pnpm clean && pnpm build && vsce package --no-dependencies && $(CURSOR) --install-extension ./code-neovim-style-tools-0.0.1.vsix --force
