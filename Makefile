PATH := node_modules/.bin:$(PATH)

.PHONY: test

setup:
	yarn
	lerna bootstrap

test:
	make stop
	mocha --recursive packages/*/test/ -t 5000
	ava
	standard
	make start
	mocha --recursive test/integration -t 5000
	ava -v test/ava/**/*.js
	make bundle
	phantomjs ./node_modules/mocha-phantomjs-core/mocha-phantomjs-core.js http://localhost:5280/test/browser/ spec '{"ignoreResourceErrors": true}'

clean:
	make stop
	rm -f prosody/prosody.err
	rm -f prosody/prosody.log
	lerna clean --yes

bundle:
	lerna run bundle

start:
	./server/ctl start

stop:
	./server/ctl stop

restart:
	./server/ctl restart
