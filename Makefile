.PHONY: setup lint test ci clean start stop restart bundlesize bundle size ncu

setup:
	node packages/xmpp.js/script.js
	npm install
	cd packages/xmpp.js/ && npm run prepublish
	make bundle

lint:
	npx eslint --cache .

test:
	cd packages/xmpp.js/ && npm run prepublish
	npm install
	make bundle
	npx jest
	make lint
	make bundlesize

ci:
	npm install
	make unit
	make lint
	make restart
	npx lerna run prepublish
	make bundle
	make e2e
	make bundlesize

unit:
	npm run test

e2e:
	$(warning e2e tests require prosody >= 0.13 and luarocks)
	cd server && prosodyctl --config prosody.cfg.lua install mod_sasl2 > /dev/null
	cd server && prosodyctl --config prosody.cfg.lua install mod_sasl2_bind2 > /dev/null
	cd server && prosodyctl --config prosody.cfg.lua install mod_sasl2_sm > /dev/null
	cd server && prosodyctl --config prosody.cfg.lua install mod_sasl2_fast > /dev/null
	npm run e2e

clean:
	make stop
	rm -f server/localhost.key
	rm -f server/localhost.crt
	rm -f server/prosody.err
	rm -f server/prosody.log
	rm -f server/prosody.pid
	rm -rf server/modules
	rm -rf server/.cache
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
	node test/bundlesize.js

bundle:
	npx rollup -c rollup.config.js

size:
	make bundle
	make bundlesize

ncu:
	ncu && npx lerna exec ncu
