# ChatGPT PDF Exporter Chrome Extension Makefile

# Variables
EXTENSION_NAME = chatgpt-pdf-exporter
VERSION = $(shell grep '"version"' manifest.json | sed -E 's/.*"version": "([^"]+)".*/\1/')
ZIP_NAME = $(EXTENSION_NAME)-v$(VERSION).zip
BUILD_DIR = build
DIST_DIR = dist

# Files and directories to include in the extension
INCLUDE_FILES = manifest.json \
                popup.html \
                scripts/*.js \
                assets/**/* \
                lib/*.js \
                _locales/**/*

# Files to exclude from the ZIP
EXCLUDE_PATTERNS = -x "*.DS_Store" \
                   -x "*~" \
                   -x "*.swp" \
                   -x "*.broken" \
                   -x "node_modules/*" \
                   -x ".git/*" \
                   -x "$(BUILD_DIR)/*" \
                   -x "$(DIST_DIR)/*" \
                   -x "Makefile" \
                   -x ".gitignore" \
                   -x "package*.json" \
                   -x "*.zip" \
                   -x "CLAUDE.md" \
                   -x ".claude" \
                   -x "README.md" \
                   -x "LICENSE" \
                   -x "PRIVACY.md" \
                   -x ".env*" \
                   -x "*.log" \
                   -x "*.bak" \
                   -x "*.backup" \
                   -x "*.old"

# Default target
.PHONY: all
all: clean build

# Clean build artifacts
.PHONY: clean
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR) $(DIST_DIR)
	@rm -f *.zip
	@echo "✅ Clean complete"

# Build the extension ZIP file
.PHONY: build
build: clean
	@echo "📦 Building Chrome extension package..."
	@mkdir -p $(DIST_DIR)
	
	# Create ZIP file with only necessary files
	@zip -r $(DIST_DIR)/$(ZIP_NAME) \
		manifest.json \
		popup.html \
		scripts/ \
		assets/ \
		lib/ \
		_locales/ \
		$(EXCLUDE_PATTERNS)
	
	@echo "✅ Build complete!"
	@echo "📁 Output: $(DIST_DIR)/$(ZIP_NAME)"
	@echo "📊 Version: $(VERSION)"
	@echo "📏 Size: $$(du -h $(DIST_DIR)/$(ZIP_NAME) | cut -f1)"

# Development build (includes source files)
.PHONY: dev
dev: clean
	@echo "🔧 Building development package..."
	@mkdir -p $(DIST_DIR)
	@zip -r $(DIST_DIR)/$(EXTENSION_NAME)-dev.zip . $(EXCLUDE_PATTERNS)
	@echo "✅ Development build complete!"
	@echo "📁 Output: $(DIST_DIR)/$(EXTENSION_NAME)-dev.zip"

# Validate manifest.json
.PHONY: validate
validate:
	@echo "🔍 Validating manifest.json..."
	@python3 -m json.tool manifest.json > /dev/null 2>&1 && echo "✅ manifest.json is valid" || echo "❌ manifest.json is invalid"

# Check file sizes
.PHONY: size
size:
	@echo "📊 Extension file sizes:"
	@echo "========================"
	@find . -type f \( -name "*.js" -o -name "*.html" -o -name "*.css" -o -name "*.json" \) \
		-not -path "./node_modules/*" \
		-not -path "./.git/*" \
		-not -path "./$(BUILD_DIR)/*" \
		-not -path "./$(DIST_DIR)/*" \
		-exec du -h {} \; | sort -rh | head -20

# List all files that will be included in the ZIP
.PHONY: list
list:
	@echo "📋 Files to be included in the extension:"
	@echo "========================================"
	@zip -r -v --dry-run temp.zip . $(EXCLUDE_PATTERNS) | grep -E "adding:|deflated" | grep -v "/$"

# Install dependencies (if any)
.PHONY: install
install:
	@echo "📥 No dependencies to install for this extension"

# Run basic tests
.PHONY: test
test: validate
	@echo "🧪 Running basic tests..."
	@echo "Checking for required files..."
	@[ -f manifest.json ] && echo "✅ manifest.json exists" || (echo "❌ manifest.json missing" && exit 1)
	@[ -f popup.html ] && echo "✅ popup.html exists" || (echo "❌ popup.html missing" && exit 1)
	@[ -d scripts ] && echo "✅ scripts directory exists" || (echo "❌ scripts directory missing" && exit 1)
	@[ -d assets ] && echo "✅ assets directory exists" || (echo "❌ assets directory missing" && exit 1)
	@[ -d _locales ] && echo "✅ _locales directory exists" || (echo "❌ _locales directory missing" && exit 1)
	@echo "✅ All tests passed!"

# Quick build for testing (no clean)
.PHONY: quick
quick:
	@echo "⚡ Quick build..."
	@mkdir -p $(DIST_DIR)
	@zip -r $(DIST_DIR)/$(ZIP_NAME) . $(EXCLUDE_PATTERNS)
	@echo "✅ Quick build complete: $(DIST_DIR)/$(ZIP_NAME)"

# Open Chrome extensions page
.PHONY: chrome
chrome:
	@echo "🌐 Opening Chrome extensions page..."
	@open -a "Google Chrome" "chrome://extensions/"

# Help
.PHONY: help
help:
	@echo "ChatGPT PDF Exporter - Build Commands"
	@echo "===================================="
	@echo "make          - Clean and build the extension"
	@echo "make build    - Build the extension ZIP file"
	@echo "make clean    - Remove build artifacts"
	@echo "make dev      - Create development build"
	@echo "make validate - Validate manifest.json"
	@echo "make size     - Show file sizes"
	@echo "make list     - List files to be included"
	@echo "make test     - Run basic tests"
	@echo "make quick    - Quick build without cleaning"
	@echo "make chrome   - Open Chrome extensions page"
	@echo "make help     - Show this help message"
	@echo ""
	@echo "Current version: $(VERSION)"