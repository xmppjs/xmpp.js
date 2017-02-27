make:
	cp -r node_modules/prismjs public/vendor/
	cp -r node_modules/bootstrap public/vendor/
	cp -r node_modules/codemirror public/vendor/
	cp -r node_modules/clipboard public/vendor/
	cp -r node_modules/jquery public/vendor/
	cp -r node_modules/tether public/vendor/
	../../node_modules/.bin/browserify public/script.js > public/bundle.js

clean:
	rm -r public/vendor/*
	rm public/bundle.js
