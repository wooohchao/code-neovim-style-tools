.PHONY: build test

VERSION ?= 0.0.2
CURSOR ?= cursor
PACKAGE_NAME = code-neovim-style-tools-$(VERSION).vsix

build:
	pnpm clean && pnpm build && vsce package --no-dependencies

test:
	@echo "Setting version to $(VERSION)"
	jq '.version = "$(VERSION)"' package.json > package.json.tmp && mv package.json.tmp package.json
	pnpm clean && pnpm build && vsce package --no-dependencies
	@mv code-neovim-style-tools-*.vsix $(PACKAGE_NAME) 2>/dev/null || true
	$(CURSOR) --install-extension ./$(PACKAGE_NAME) --force
