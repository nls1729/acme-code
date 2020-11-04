# Activities Configurator Makefile

.ONESHELL:
UUID = activities-config@nls1729
IMAGES = face-smile-3.svg
MODULES = colors.js extension.js keys.js notify.js readme.js stylesheet.css metadata.json
POFILES = $(wildcard po/*.po)
JSFILES = colors.js extension.js keys.js notify.js prefs.js readme.js
ZIPDATE = $(shell date +"%F %H:%M")
ZIPTS = $(shell date +"%y%j%H%M")
COMMIT = $(shell git rev-parse --short=8 HEAD)
EXTENSIONS_DIR = ~/.local/share/gnome-shell/extensions
GSVERSIONS = $(shell cat ./GSVERSIONS)
VERSION = $(shell cat ./VERSION)
GSCHEMAXML = ./schemas/org.gnome.shell.extensions.activities-config.gschema.xml
BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
ifeq ($(BRANCH),master)
ZIPNAME = activities-config$(ZIPTS)@nls1729
else
ZIPNAME = activities-config$(ZIPTS)$(BRANCH)@nls1729
endif

extension: ./schemas/gschemas.compiled $(POFILES:.po=.mo)
	echo "extensionOOO:"
 
all: extension
	echo "allOOO:"

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.activities-config.gschema.xml.in
	echo "./schemas/gschemas.compiledOOO:"
	cat $(GSCHEMAXML).in > $(GSCHEMAXML)
	glib-compile-schemas ./schemas/

./po/%.mo: ./po/%.po
	echo "./po/%.moOOO:"
	msgfmt -c $< -o $@

_build: all
	echo "_buildOOO:"
	rm -rf ./_build
	mkdir -p _build
	cat metadata.json.in | sed "s/GSVERSIONS/$(GSVERSIONS)/" | sed "s/VERSION/$(VERSION)/" > metadata.json
	cat README.txt.in | sed "s/^zip file:.*$\/zip file: $(ZIPDATE) $(COMMIT)/" > _build/README.txt
	cat prefs.js | sed "s/Commit: .*$\/Commit: $(COMMIT) $(ZIPDATE) $(BRANCH)\";/" > _build/prefs.js
	xgettext $(JSFILES) -o _build/message.pot;
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
	echo "zip-fileOOO:"
	rm -f ./*.zip
	cd _build ; \
	zip -qr "$(ZIPNAME).zip" .; \
	mv $(ZIPNAME).zip .. ; \
	cd .. ;
	sha256sum "$(ZIPNAME).zip"  > ../CHECKSUM
	rm -rf _build

clean:
	echo "cleanOOO:"
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo
	rm -f ./*.zip
	rm -f ./.*~
	rm -f ./*~
	rm -f ./*.swp
	rm -rf _build

install:
	echo "install"
	rm -rf $(EXTENSIONS_DIR)/$(UUID)
	mkdir -p $(EXTENSIONS_DIR)/$(UUID)
	cp -f "$(UUID).zip" $(EXTENSIONS_DIR)/$(UUID)
	cd $(EXTENSIONS_DIR)/$(UUID); \
	unzip "$(UUID).zip"; \
	echo done
