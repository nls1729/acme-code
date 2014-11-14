# Lockscreen

UUID = lockscreen@donaldpakkies.gmail.com
MODULES = extension.js metadata.json LICENSE

all: extension

extension: gschemas.compiled

./gschemas.compiled: ./org.gnome-shell.extensions.lockscreen.gschema.xml
	glib-compile-schemas ./

_build: all
	-rm -fR ./_build
	mkdir _build
	cp $(MODULES) _build
	cp *.xml _build
	cp gschemas.compiled _build

zip-file: _build
	cd _build ; \
	zip -qr "$(UUID).zip" .
	mv _build/$(UUID).zip ./
	-rm -fR _build
clean:
	rm -f ./gschemas.compiled
	rm -f ./*.zip
	rm -f ./.~
	rm -f ./*~
