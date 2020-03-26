.ONESHELL:
UUID = donotdisturb-button@nls1729
IMAGES = available-yes.png available-no.png default-persistence.png gnome-session-reboot.png \
         arrow-right.png audio-volume-on.png audio-volume-muted.png \
         busy-notifications-symbolic.svg available-notifications-symbolic.svg

MODULES = extension.js correctClass.js dndBtn.js dndBtnGObject.js force.js
POFILES = $(wildcard po/*.po)
JSFILES = extension.js prefs.js correctClass.js dndBtn.js dndBtnGObject.js force.js
ZIPDATE = $(shell date +"%F %H:%M")
ZIPTS = $(shell date +"%y%j%H%M")
COMMIT = $(shell git rev-parse --short=8 HEAD)
EXTENSIONS_DIR = ~/.local/share/gnome-shell/extensions
GSVERSIONS = $(shell cat ./GSVERSIONS)
VERSION = $(shell cat ./VERSION)
SCHEMAXMLIN = ./schemas/schema.xml.in
GSCHEMAXML = ./schemas/org.gnome.shell.extensions.donotdisturb-button.gschema.xml
BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
ifeq ($(BRANCH),master)
ZIPNAME = donotdisturb-button$(ZIPTS)@nls1729
else
ZIPNAME = donotdisturb-button$(ZIPTS)$(BRANCH)@nls1729
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
		cp $$langmo $$langdir/LC_MESSAGES/donotdisturb-button-extension.mo; \
	done;

zip-file: _build
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
	cp -f "$(ZIPNAME).zip" $(EXTENSIONS_DIR)/$(UUID)
	cd $(EXTENSIONS_DIR)/$(UUID); \
	unzip "$(ZIPNAME).zip"; \
	echo done
