.PHONY: setup test clean bundle start stop restart size bundlesize

setup:
	node packages/xmpp.js/script.js
	yarn
	./node_modules/.bin/lerna bootstrap
	cd packages/xmpp.js/ && yarn run prepublish
	node bundle.js

lint:
	./node_modules/.bin/eslint .

test:
	cd packages/xmpp.js/ && yarn run prepublish
	yarn
	./node_modules/.bin/lerna bootstrap
	node bundle.js
	./node_modules/.bin/ava
	make lint
	make bundlesize

test-ci:
	yarn
	./node_modules/.bin/lerna bootstrap
	./node_modules/.bin/ava
	make lint
	make restart
	./node_modules/.bin/lerna run prepublish
	node bundle.js
	./node_modules/.bin/ava --serial --fail-fast test/*
	make bundlesize

clean:
	make stop
	rm -f prosody/prosody.err
	rm -f prosody/prosody.log
	rm -f prosody/prosody.pid
	./node_modules/.bin/lerna clean --yes
	rm -rf node_modules/
	rm -f packages/*/dist/*.js
	rm -f lerna-debug.log

start:
	./server/ctl.js start

stop:
	./server/ctl.js stop

restart:
	./server/ctl.js restart

bundlesize:
	./node_modules/.bin/bundlesize

bundle:
	node bundle.js

size:
	make bundle
	make bundlesize
