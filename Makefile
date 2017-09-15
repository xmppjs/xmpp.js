PATH := node_modules/.bin:$(PATH)

.PHONY: setup test clean bundle start stop restart size

setup:
	yarn
	lerna bootstrap

lint:
	eslint .

test:
	ava
	eslint .
	make restart
	ava --serial --fail-fast test/
	make size

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

size:
	cd packages/xmpp.js && yarn run prepublish
	bundlesize
