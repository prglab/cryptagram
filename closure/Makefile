all:
	@echo Please choose a valid option.

release-encoder:
	./build_demo.sh
	rm -rf ../site-encoder
	cp -r build/demo ../site-encoder
	mv ../site-encoder/index-compiled.html ../site-encoder/index.html
	git add -f ../site-encoder/*
	git commit ../site-encoder/* -m "Site Encoder Update"
	@echo
	@echo 'Now push to the main fork:'
	@echo
	@echo '   git push prglab master'

extension:
	rm -rf build/chrome-extension
	./build_extension.sh
	cd build && zip -r chrome-extension.zip chrome-extension

serve-extension:
	./serve_dev_extension.sh

clean:
	rm -rf build