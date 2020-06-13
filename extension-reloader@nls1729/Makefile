.ONESHELL:
UUID = extension-reloader@nls1729
FILES = extension.js COPYING emblem-synchronizing-symbolic.svg
POFILES = $(wildcard po/*.po)
JSFILES = extension.js prefs.js
ZIPDATE = $(shell date +"%F %H:%M")
ZIPTS = $(shell date +"%y%j%H%M")
COMMIT = $(shell git rev-parse --short=8 HEAD)
EXTENSIONS_DIR = ~/.local/share/gnome-shell/extensions
GSVERSIONS = $(shell cat ./GSVERSIONS)
VERSION = $(shell cat ./VERSION)
SCHEMAXMLIN = ./schemas/schema.xml.in
GSCHEMAXML = ./schemas/org.gnome.shell.extensions.extension-reloader.gschema.xml
BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
ifeq ($(BRANCH),master)
ZIPNAME = extension-reloader-$(ZIPTS)@nls1729
else
ZIPNAME = extension-reloader-$(ZIPTS)$(BRANCH)@nls1729
endif

all: extension

extension: ./schemas/gschemas.compiled $(POFILES:.po=.mo)

./schemas/gschemas.compiled: $(SCHEMAXMLIN)
	cat $(SCHEMAXMLIN) | sed "s/EPVERSION/$(VERSION)/" | sed "s/GSPVERSIONS/$(GSVERSIONS)/" > $(GSCHEMAXML)
	glib-compile-schemas ./schemas/

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

_build: all
	rm -rf ./_build
	mkdir -p _build
	xgettext $(JSFILES) -o ./_build/messages.pot;
	cat README.txt.in | sed "s/^zip file:.*$\/zip file: $(ZIPDATE) $(COMMIT)/" > ./_build/README.txt
	cat prefs.js | sed "s/Commit:.*$\/Commit: $(COMMIT) $(ZIPDATE) $(BRANCH)\";/" > ./_build/prefs.js
	cat metadata.json.in | sed "s/GSVERSIONS/$(GSVERSIONS)/" | sed "s/VERSION/$(VERSION)/" > _build/metadata.json
	cp $(FILES) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale

	for langmo in $(POFILES:.po=.mo) ; do \
		langdir=_build/locale/`basename $$langmo .mo`; \
		mkdir -p $$langdir; \
		mkdir -p $$langdir/LC_MESSAGES; \
		cp $$langmo $$langdir/LC_MESSAGES/nls1729-extensions.mo; \
	done;

zip-file: clean _build
	rm -f ./*.zip
	cd _build ; \
	zip -qr "$(ZIPNAME).zip" .; \
	mv $(ZIPNAME).zip .. ; \
	cd .. ;
	sha256sum "$(ZIPNAME).zip"  > CHECKSUM
	rm -rf _build

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo
	rm -f ./*.zip
	rm -f ./.*~
	rm -f ./*~
	rm -f ./*.swp
	rm -rf _build


install:
	rm -rf $(EXTENSIONS_DIR)/$(UUID)
	mkdir -p $(EXTENSIONS_DIR)/$(UUID)
	cp -f "$(UUID).zip" $(EXTENSIONS_DIR)/$(UUID)
	cd $(EXTENSIONS_DIR)/$(UUID); \
	unzip "$(ZIPNAME).zip"; \
	echo done
