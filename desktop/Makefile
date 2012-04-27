all:
	@echo Please be more specific.

mac:
	python setup.py py2app --no-strip
	cp -r static dist/Cryptogram.app/Contents/Resources/
	cp -r templates dist/Cryptogram.app/Contents/Resources/

linux:
	python setup.py build

clean:
	rm -rf *.pyc *.log build/ dist/
