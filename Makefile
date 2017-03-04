PATH := node_modules/.bin:$(PATH)

.PHONY: setup test clean bundle start stop restart

setup:
	yarn
	lerna bootstrap
	make bundle

test:
	ava
	standard
	make restart
	ava -v test/

clean:
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
