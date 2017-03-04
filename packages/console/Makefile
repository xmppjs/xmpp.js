make:
	# bootstrap
	cp node_modules/bootstrap/dist/css/bootstrap.css public/vendor/
	cp node_modules/bootstrap/dist/js/bootstrap.js public/vendor/
	# notie
	cp node_modules/notie/dist/notie.css public/vendor/
	# jQuery
	cp node_modules/jquery/dist/jquery.slim.js public/vendor/
	# tether
	cp node_modules/tether/dist/js/tether.js public/vendor/
	# notie
	cp node_modules/notie/dist/notie.js public/vendor/
	# clipboard
	cp node_modules/clipboard/dist/clipboard.js public/vendor/
	# prismjs
	cd node_modules/prismjs/ && cat themes/prism-solarizedlight.css plugins/autolinker/prism-autolinker.css plugins/autolinker/prism-autolinker.css plugins/toolbar/prism-toolbar.css > ../../public/vendor/prism.css
	cd node_modules/prismjs/ && cat prism.js plugins/autolinker/prism-autolinker.js plugins/toolbar/prism-toolbar.js plugins/copy-to-clipboard/prism-copy-to-clipboard.js > ../../public/vendor/prism.js
	# codemirror
	cd node_modules/codemirror/ && cat lib/codemirror.css theme/solarized.css addon/lint/lint.css addon/fold/foldgutter.css addon/hint/show-hint.css > ../../public/vendor/codemirror.css
	cd node_modules/codemirror/ && cat lib/codemirror.js mode/xml/xml.js addon/hint/show-hint.js addon/hint/xml-hint.js addon/fold/foldcode.js addon/fold/foldgutter.js addon/fold/xml-fold.js addon/edit/matchtags.js addon/edit/closetag.js > ../../public/vendor/codemirror.js

	../../node_modules/.bin/browserify public/script.js > public/bundle.js

clean:
	rm public/vendor/*
	rm public/bundle.js
