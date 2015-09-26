# Do Not Disturb Extension Makefile

# Before making zip file insure all changes have been committed.
# README.txt is modified to indicate the date and time the zip file was
# created and the current git commit.  VERSION should be set to the
# current extension version.

UUID = donotdisturb-button@nls1729
MODULES = README.txt COPYING extension.js metadata.json
ZIPDATE = $(shell date +"%F %H:%M:%S")
EXTENSIONS_DIR = ~/.local/share/gnome-shell/extensions
COMMIT = $(shell git rev-parse HEAD)
VERSION = $(shell cat ./VERSION)

all: $(MODULES)
	-rm -fR _build
	mkdir -p _build
	cp $(MODULES) _build
	sed -i 's/"version":.*$\/"version": $(VERSION)/' _build/metadata.json;
	sed -i 's/^zip file:.*$\/zip file: $(ZIPDATE) $(COMMIT)/'  _build/README.txt;
	cd _build ; \
	zip -qr "$(UUID).zip" .
	mv _build/$(UUID).zip ./
	-rm -fR _build

install:
	rm -rf $(EXTENSIONS_DIR)/$(UUID)
	mkdir -p $(EXTENSIONS_DIR)/$(UUID)
	cp -r ./_build/* $(EXTENSIONS_DIR)/$(UUID)/
	-rm -fR _build
	echo done

clean:
	-rm -fR _build
	rm -f ./.~
	rm -f ./*~
