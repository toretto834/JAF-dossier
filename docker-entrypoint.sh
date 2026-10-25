#!/bin/sh
set -eu
./node_modules/.bin/prisma db push --skip-generate
exec node ./node_modules/next/dist/bin/next start
