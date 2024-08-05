develop:
	npx webpack serve

install:
	npm ci

build:
	NODE_ENV=production npx webpack

test:
	npm test

lint:
	npx eslint .
lintfix:
	npx eslint . --fix
.PHONY: test