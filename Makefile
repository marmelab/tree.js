NODE_PATH := ${NODE_PATH}:/usr/local/lib/node_modules
PATH := ${CURDIR}/node_modules/.bin:${CURDIR}/node_modules/karma/bin:${PATH}

install:
	bower install
	npm install

test-spec: build
	CHROME_BIN=`which chromium-browser` karma start test/karma.conf.js --single-run

build: src/*
	cd build && r.js -o build.js
