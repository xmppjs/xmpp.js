PATH := $(PATH):node_modules/.bin

.PHONY: setup test clean bundle start stop restart size bundlesize

setup:
	node packages/xmpp.js/script.js
	yarn
	lerna bootstrap
	cd packages/xmpp.js/ && yarn run prepublish

lint:
	eslint .

test:
	cd packages/xmpp.js/ && yarn run prepublish
	yarn
	lerna bootstrap
	cd packages/client/ && yarn run prepublish
	ava
	eslint .
	make bundlesize

test-ci:
	yarn
	lerna bootstrap
	ava
	eslint .
	make restart
	lerna run prepublish
	ava --serial --fail-fast test/
	make bundlesize

clean:
	make stop
	rm -f prosody/prosody.err
	rm -f prosody/prosody.log
	rm -f prosody/prosody.pid
	lerna clean --yes
	rm -rf node_modules/
	rm -f packages/*/dist/*.js
	rm -f lerna-debug.log

start:
	./server/ctl start

stop:
	./server/ctl stop

restart:
	./server/ctl restart

bundlesize:
	gzip -kf9 packages/client/dist/xmpp.min.js
	bundlesize

bundle:
	cd packages/client && yarn run prepublish

size:
	make bundle
	make bundlesize
