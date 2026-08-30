# ============================================================
# CURRENTS · Makefile — the repo's commands, in one place
#
# Thin wrappers over the npm scripts (which stay the source of
# truth for CI and for anyone without make). Run `make` or
# `make help` for the list.
#
#   make translate              all locales on disk (de es …)
#   make translate LOCALE=de    one locale
#   make translate LOCALE=de FLAGS="--only ti --dry-run"
# ============================================================

# Locales = every directory under content/ except the English
# source and the glossaries. A new locale dir appears here on
# its own; override with LOCALE=xx for a single-language run.
LOCALES := $(filter-out en glossary,$(patsubst content/%/,%,$(wildcard content/*/)))
LOCALE  ?=
FLAGS   ?=
TRANSLATE_LOCALES := $(if $(LOCALE),$(LOCALE),$(LOCALES))

.DEFAULT_GOAL := help
.PHONY: help install dev build preview check copy-check copy-write i18n-check translate shots

help: ## list the available commands
	@grep -hE '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*##"} {printf "  make %-12s %s\n", $$1, $$2}'

install: ## install dependencies
	npm install

dev: ## start the Vite dev server (launch config "currents", port 5183)
	npm run dev

build: ## production build into dist/
	npm run build

preview: ## serve the production build locally
	npm run preview

check: copy-check i18n-check ## all repo checks (content map + locales)

copy-check: ## verify inline English, map keys, and schema (tools/copy-sync.mjs)
	npm run copy:check

copy-write: ## regenerate inline English from the map; normalize JSON
	npm run copy:write

i18n-check: ## validate every locale against content/en and the glossaries
	npm run i18n:check

translate: ## machine-translate content/en into every locale (LOCALE=xx for one; FLAGS=… forwarded)
	node tools/i18n-locale.mjs $(if $(LOCALE),--locale $(LOCALE),) $(FLAGS)

shots: ## capture the locale layout proofs into .shots/ (dev server must be running)
	bash tools/shots.sh
