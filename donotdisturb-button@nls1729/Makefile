# Do Not Disturb Extension Makefile

# Before making zip file insure all changes have been committed.
# README.txt is modified to indicate the date and time the zip file was
# created and the current git commit.  VERSION should be set to the
# current extension version.

UUID = donotdisturb-button@nls1729
MODULES = README.txt COPYING extension.js metadata.json
ZIPDATE = $(shell date +"%F %H:%M:%S")
EXTENSIONS_DIR = ~/.local/share/gnome-shell/extensions
COMMIT = $(git rev-parse HEAD)
VERSION = $(shell cat ./VERSION)

all: extension

extension: $(MODULES)

_build: all
	-rm -fR ./_build
	mkdir -p _build
	cp $(MODULES) _build
	sed -i 's/"version": 0/"version": $(VERSION)/' _build/metadata.json;
	sed -i 's/^zip:.*$\/zip: $(ZIPDATE) Commit: $(COMMIT)/'  _build/README.txt;

zip-file: _build
	cd _build ; \
	zip -qr "$(UUID).zip" .
	mv _build/$(UUID).zip ./
	-rm -fR _build

install: _build
	rm -rf $(EXTENSIONS_DIR)/$(UUID)
	mkdir -p $(EXTENSIONS_DIR)/$(UUID)
	cp -r ./_build/* $(EXTENSIONS_DIR)/$(UUID)/
	-rm -fR _build
	echo done

clean:
	rm -f ./*.zip
	rm -f ./.~
	rm -f ./*~
