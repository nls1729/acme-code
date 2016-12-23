# Extension Reloader Makefile

# Before making zip file insure all changes have been committed.
# README.txt is modified to indicate the date and time the zip file was
# created and the current git commit.  VERSION should be set to the
# current extension version.
.ONESHELL:
UUID = extension-reloader@nls1729
MODULES = metadata.json README.txt extension.js COPYING notify.js prefs.js
POFILES = $(wildcard po/*.po)
ZIPDATE = $(shell date)
COMMIT = $(shell git rev-parse HEAD)
VERSION = $(shell cat ./VERSION)

all: extension

extension: ./schemas/gschemas.compiled $(POFILES:.po=.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.extension-reloader.gschema.xml
	glib-compile-schemas ./schemas/

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

build: all
	rm -rf ./_build
	mkdir -p _build
	cp $(MODULES) _build
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale
	cp po/messages.pot _build/locale
	for langmo in $(POFILES:.po=.mo) ; do \
		langdir=_build/locale/`basename $$langmo .mo`; \
		mkdir -p $$langdir; \
		mkdir -p $$langdir/LC_MESSAGES; \
		cp $$langmo $$langdir/LC_MESSAGES/nls1729-extensions.mo; \
	done;
	sed -i 's/"version":.*$\/"version": $(VERSION)/' _build/metadata.json; \
	sed -i 's/^zip file:.*$\/zip file: $(ZIPDATE) $(COMMIT)/'  _build/README.txt; \
	cp -f _build/README.txt .;

zip-file: build
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
	rm -f ./*.zip
	rm -f ./.~
	rm -f ./*~
	rm -rf _build




