NODE_PATH := ${NODE_PATH}:/usr/local/lib/node_modules
PATH := ${CURDIR}/node_modules/.bin:${CURDIR}/node_modules/karma/bin:${PATH}

test-spec:
	CHROME_BIN=`which chromium-browser` karma start test/karma.conf.js --single-run

build:
	cd build && r.js -o build.js
