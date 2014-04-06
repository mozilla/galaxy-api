REPORTER = list

test:
	make test-lib

test-lib:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) test/lib/*.js

.PHONY: test test-lib
