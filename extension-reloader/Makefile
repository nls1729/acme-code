# Extension Reloader Makefile

# Before making zip file insure all changes have been committed.
# README.txt is modified to indicate the date and time the zip file was
# created and the current git commit.  VERSION should be set to the
# current extension version.
.ONESHELL:
UUID = extension-reloader@nls1729
MODULES = metadata.json README.txt extension.js gnome-shell-extension-tool COPYING
ZIPDATE = $(shell date)
COMMIT = $(shell git rev-parse HEAD)
VERSION = $(shell cat ./VERSION)

all: metadata.json README.txt extension.js gnome-shell-extension-tool

_build: all
	rm -rf ./_build
	mkdir -p _build
	cp $(MODULES) _build
	sed -i 's/"version":.*$\/"version": $(VERSION)/' _build/metadata.json; \
	sed -i 's/^zip file:.*$\/zip file: $(ZIPDATE) $(COMMIT)/'  _build/README.txt; \
	sed -i 's/"Commit: .*$\/"Commit: $(COMMIT)";/'  _build/prefs.js; \
	cp -f _build/README.txt .;

zip-file: _build
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




