all:
	@echo Please be more specific.

mac:
	python setup.py py2app -A
	cp -r static dist/Cryptogram.app/Contents/Resources/
	cp -r templates dist/Cryptogram.app/Contents/Resources/

mac-release:
	python setup.py py2app --no-strip -O2
	cp -r static dist/Cryptogram.app/Contents/Resources/
	cp -r templates dist/Cryptogram.app/Contents/Resources/

linux:
	python setup.py build

clean:
	rm -rf *.log build/ dist/
	find . -name "*.pyo" | xargs rm -f
	find . -name "*.pyc" | xargs rm -f
