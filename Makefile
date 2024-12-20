.PHONY: setup lint test ci clean start stop restart bundlesize bundle size ncu

setup:
	node packages/xmpp.js/script.js
	npm install
	cd packages/xmpp.js/ && npm run prepublish
	node bundle.js

lint:
	npx eslint --cache .

test:
	cd packages/xmpp.js/ && npm run prepublish
	npm install
	node bundle.js
	npx jest
	make lint
	make bundlesize

ci:
	npm install
	npx jest
	make lint
	make restart
	npx lerna run prepublish
	node bundle.js
	make e2e
	make bundlesize

e2e:
	NODE_TLS_REJECT_UNAUTHORIZED=0 npx jest --runInBand --config e2e.config.js

clean:
	make stop
	rm -f server/localhost.key
	rm -f server/localhost.crt
	rm -f server/prosody.err
	rm -f server/prosody.log
	rm -f server/prosody.pid
	npx lerna clean --yes
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
	npx bundlesize

bundle:
	node bundle.js

size:
	make bundle
	make bundlesize

ncu:
	ncu && npx lerna exec ncu
