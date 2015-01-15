# Activities Configurator Makefile

# Before making zip file insure all changes have been committed.
# README.txt is modified to indicate the date and time the zip file was
# created and the current git commit.  VERSION should be set to the
# current extension version.

UUID = activities-config@nls1729
MODULES = colors.js convenience.js COPYING extension.js face-smile-3.svg keys.js metadata.json \
          notify.js prefs.js readme.js README.txt stylesheet.css
POFILES = $(wildcard po/*.po)
ZIPDATE = $(shell date)
COMMIT = $(shell git rev-parse HEAD)
VERSION = $(shell cat ./VERSION)

all: extension

extension: ./schemas/gschemas.compiled $(POFILES:.po=.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.activities-config.gschema.xml
	glib-compile-schemas ./schemas/

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

_build: all
	-rm -fR ./_build
	mkdir -p _build
	cp $(MODULES) _build
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
	sed -i 's/"version": 0/"version": $(VERSION)/' _build/metadata.json;
	sed -i 's/^zip file:.*$\/zip file: $(ZIPDATE) $(COMMIT)/'  _build/README.txt;

zip-file: _build
	cd _build ; \
	zip -qr "$(UUID).zip" .
	mv _build/$(UUID).zip ./
	-rm -fR _build
clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo
	rm -f ./*.zip
	rm -f ./.~
	rm -f ./*~
