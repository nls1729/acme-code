# Activities Configurator Makefile

.ONESHELL:
UUID = activities-config@nls1729
IMAGES = face-smile-3.svg
MODULES = colors.js convenience.js extension.js keys.js notify.js readme.js stylesheet.css 
POFILES = $(wildcard po/*.po)
JSFILES = colors.js extension.js keys.js notify.js prefs.js readme.js
ZIPDATE = $(shell date +"%F %H:%M:%S")
COMMIT = $(shell git rev-parse HEAD)
EXTENSIONS_DIR = ~/.local/share/gnome-shell/extensions
TOUCH = $(shell find . -type f)
TIMESTAMP = $(shell date +"%y%j%H%M%S")
GSVERSIONS = $(shell cat ./GSVERSIONS)
VERSION = $(shell cat ./VERSION)

all: extension

extension: ./schemas/gschemas.compiled $(POFILES:.po=.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.activities-config.gschema.xml
	glib-compile-schemas ./schemas/

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

_build: all
	rm -rf ./_build
	mkdir -p _build
	xgettext $(JSFILES) -o _build/message.pot;
	cat README.txt | sed "s/^zip file:.*$\/zip file: $(ZIPDATE) $(COMMIT)/" > _build/README.txt
	cat prefs.js | sed "s/Commit: .*$\/Commit: $(COMMIT)\";/" > _build/prefs.js
	cat metadata.json | sed "s/GSVERSIONS/$(GSVERSIONS)/" | sed "s/VERSION/$(VERSION)/" > _build/metadata.json
	cp $(MODULES) _build
	cp $(IMAGES) _build
	cp COPYING _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale
	for langmo in $(POFILES:.po=.mo) ; do \
		langdir=_build/locale/`basename $$langmo .mo`; \
		mkdir -p $$langdir; \
		mkdir -p $$langdir/LC_MESSAGES; \
		cp $$langmo $$langdir/LC_MESSAGES/activities-config-extension.mo; \
	done;

zip-file: _build
	rm -f ./*.zip
	cd _build ; \
	zip -qr "$(UUID).zip" .; \
	mv $(UUID).zip .. ; \
	cd .. ;
	sha256sum "$(UUID).zip"  > CHECKSUM
	rm -rf _build

touch:
	for file in $(MODULES); do \
		touch $$file; \
	done;

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo
	rm -f ./*.zip
	rm -f ./.~
	rm -f ./*~
	rm -rf _build

install:
	rm -rf $(EXTENSIONS_DIR)/$(UUID)
	mkdir -p $(EXTENSIONS_DIR)/$(UUID)
	cp -f "$(UUID).zip" $(EXTENSIONS_DIR)/$(UUID)
	cd $(EXTENSIONS_DIR)/$(UUID); \
	unzip "$(UUID).zip"; \
	echo done
