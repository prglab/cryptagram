all:
	@echo
	@echo Converting Python to Javascript.
	~/repos/pyjamas/bin/pyjsbuild -P safari SeeMeNot.py

	@echo
	@echo Separating HTML from JS for security.
	python post-process-pyjsbuild-html.py output/SeeMeNot.html
	python post-process-pyjsbuild-html.py output/SeeMeNot.nocache.html
	python post-process-pyjsbuild-html.py output/SeeMeNot.safari.cache.html
	python post-process-pyjsbuild-html.py output/history.html

	@echo
	@echo Beautifying javascript for debugging.
	for js_file in output/*.js;	\
	do \
		js-beautify -s 2 -j -o $$js_file.tmp $$js_file; \
		mv $$js_file.tmp $$js_file; \
	done

	@echo
	@echo Copying extension-related files.
	cp manifest.json output/
	cp background.js output/
	cp rewrite.js output/
	cp icon.png output/
	cp popup.html output/
	cp popup.js output/
	cp contentscript.js output/
	cp sjcl.js output/

	@echo
	@echo Removing unnecessary files.
	rm -f output/__init__.py output/_pyjs.js

	@echo
	@echo "Done. (Load unpacked extension from 'output' directory.)"

clean:
	rm -rf output ImageCoder.js ImageData.js Menus.js SeeMeNot.js SymbolShape.js \
		util.js
