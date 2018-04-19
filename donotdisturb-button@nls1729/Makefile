# Do Not Disturb Extension Makefile

# Before making zip file insure all changes have been committed.
# README.txt is modified to indicate the date and time the zip file was
# created and the current git commit.  VERSION should be set to the
# current extension version.

.ONESHELL:

UUID = donotdisturb-button@nls1729
MODULES = README.txt COPYING extension.js prefs.js metadata.json available-yes.png \
          available-no.png default-persistence.png gnome-session-reboot.png
POFILES = $(wildcard po/*.po)
ZIPDATE = $(shell date +"%F %H:%M:%S")
COMMIT = $(shell git rev-parse HEAD)
VERSION = $(shell cat ./VERSION)
EXTENSIONS_DIR = ~/.local/share/gnome-shell/extensions
TOUCH = $(shell find . -type f)

all: extension

extension: ./schemas/gschemas.compiled $(POFILES:.po=.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.donotdisturb-button.gschema.xml
	glib-compile-schemas ./schemas/

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

_build: all
	rm -rf ./_build
	mkdir -p _build
	sed -i 's/"version":.*$\/"version": $(VERSION)/' metadata.json;
	sed -i 's/^zip file:.*$\/zip file: $(ZIPDATE) $(COMMIT)/' README.txt;
	sed -i 's/"Commit: .*$\/"Commit: $(COMMIT)";/' prefs.js;
	cp $(MODULES) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale
	for langmo in $(POFILES:.po=.mo) ; do \
		langdir=_build/locale/`basename $$langmo .mo`; \
		mkdir -p $$langdir; \
		mkdir -p $$langdir/LC_MESSAGES; \
		cp $$langmo $$langdir/LC_MESSAGES/donotdisturb-button-extension.mo; \
	done;

	cp -f _build/metadata.json . ; \
	cp -f _build/README.txt . ; \
	cp -f _build/prefs.js . ;

zip-file: _build
	rm -f ./*.zip
	cd _build ; \
	zip -qr "$(UUID).zip" .; \
	mv $(UUID).zip .. ; \
	cd .. ;
	sha256sum "$(UUID).zip"  > CHECKSUM
	rm -rf ./_build

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo
	rm -f ./*.zip
	rm -f ./.~
	rm -f ./*~
	rm -rf _build

touch:
	for file in $(TOUCH); do \
		touch $$file; \
	done;

install:
	rm -rf $(EXTENSIONS_DIR)/$(UUID)
	mkdir -p $(EXTENSIONS_DIR)/$(UUID)
	cp -f "$(UUID).zip" $(EXTENSIONS_DIR)/$(UUID)
	cd $(EXTENSIONS_DIR)/$(UUID); \
	unzip "$(UUID).zip"; \
	echo done

