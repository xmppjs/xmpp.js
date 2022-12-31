.PHONY: setup lint test ci clean start stop restart bundlesize bundle size cert ncu

setup:
	node packages/xmpp.js/script.js
	npm install
	./node_modules/.bin/lerna bootstrap
	cd packages/xmpp.js/ && npm run prepublish
	node bundle.js

lint:
	./node_modules/.bin/eslint --cache .

test:
	cd packages/xmpp.js/ && npm run prepublish
	npm install
	./node_modules/.bin/lerna bootstrap
	node bundle.js
	./node_modules/.bin/ava
	make lint
	make bundlesize

ci:
	npm install
	./node_modules/.bin/lerna bootstrap
	./node_modules/.bin/ava
	make lint
	make restart
	./node_modules/.bin/lerna run prepublish
	node bundle.js
	./node_modules/.bin/ava --tap --config e2e.config.js
	make bundlesize

clean:
	make stop
	rm -f server/localhost.key
	rm -f server/localhost.crt
	rm -f server/prosody.err
	rm -f server/prosody.log
	rm -f server/prosody.pid
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

ncu:
	ncu && npx lerna exec ncu
