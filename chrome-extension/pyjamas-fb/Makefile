all:
	~/repos/pyjamas/bin/pyjsbuild -P safari SeeMeNot.py

	python post-process-pyjsbuild-html.py output/SeeMeNot.html
	python post-process-pyjsbuild-html.py output/SeeMeNot.nocache.html
	python post-process-pyjsbuild-html.py output/SeeMeNot.safari.cache.html
	python post-process-pyjsbuild-html.py	output/history.html

	cp manifest.json output/

	cp background.js output/
	cp rewrite.js output/

	cp icon.png output/
	cp popup.html output/
	cp popup.js output/

	cp contentscript.js output/
	cp sjcl.js output/

	rm -f output/__init__.py output/_pyjs.js
clean:
	rm -rf output ImageCoder.js ImageData.js Menus.js SeeMeNot.js SymbolShape.js \
		util.js
