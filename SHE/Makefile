# SHE - Start Here Extension Makefile

# Before making zip file insure all changes have been committed.
# README.md is modified to indicate the date and time of the build
# and the current local . VERSION
# should be set to the current extension version.  The current
# version is placed in metadata.json.  The sha256sum of the files
# to be zipped with the exception of metadata.json) is placed in
# CHECKSUM. CHECKSUM is signed with gpg.  The sha256sum of CHECKSUN
# is recorded in the description in metadata.json.


UUID = SHE@nls1729

MODULES = COPYING dee.js extension.js langpostfixer.js \
notifications.js prefs.js README.md stylesheet.css

ETC = etc/dee.png etc/dee.ui etc/nls1729@gmail.com.asc \
etc/prefs.ui etc/README.html etc/verify.gpg \

CS = $(shell sha256sum _build/CHECKSUM | cut -c1-64)
POFILES = $(wildcard po/*.po)
ZIPDATE = $(shell date +%Y%m%d:%H:%M:%S)
COMMIT = $(shell git rev-parse --short HEAD)
TAG = $(shell git describe) 
VERSION = $(shell cat ./VERSION)
KEYID = 26754C79
HOMEDIR = /run/media/$(USER)/HOMEDIR

all: langmofiles

langmofiles: $(POFILES:.po=.mo)

./po/%.mo: ./po/%.po
	msgfmt -c $< -o $@

_build: all
	rm -fR ./_build
	for file in $(MODULES) ; do \
		#Strip trailing spaces from files \
		sed -i 's/[[:space:]]*$$//' "$$file"; \
	done;
	mkdir -p _build
	cp $(MODULES) _build
	mkdir -p _build/etc
	cp -p $(ETC) _build/etc  
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cd _build; \
	glib-compile-schemas ./schemas/;
	mkdir -p _build/locale
	for langmo in $(POFILES:.po=.mo) ; do \
		langdir=_build/locale/`basename $$langmo .mo`; \
		mkdir -p $$langdir; \
		mkdir -p $$langdir/LC_MESSAGES; \
		cp $$langmo $$langdir/LC_MESSAGES/nls1729-extensions.mo; \
	done;
	sed -i 's/^Build:.*$\/Build: $(ZIPDATE) Local: $(TAG) $(COMMIT)/' \
		 _build/README.md;
	markdown _build/README.md -o _build/etc/README.html
	cd _build ; \
	for file in $(MODULES) $(ETC); do \
		sha256sum ./$${file} >> CHECKSUM; \
	done;
	cp metadata.json _build;
	cd _build ; \
	gpg --no-random-seed-file --homedir $(HOMEDIR) --default-key \
		$(KEYID) --detach-sign CHECKSUM; \
	sed -i 's/"version": 0/"version": $(VERSION)/' metadata.json;
	
zip-file:
	sed -i 's/Checksum:.*\"/Checksum:$(CS)\"/' _build/metadata.json;
	cd _build ; \
	zip -qr $(UUID).zip .
	mv _build/$(UUID).zip ./

clean:  
	rm -fR _build
	rm -f ./po/*.mo
	rm -f ./*.zip
	rm -f ./.~
	rm -f ./*~
	rm -f ./etc/*~
	rm -f ./po/*~
	rm -f ./schemas/*~

