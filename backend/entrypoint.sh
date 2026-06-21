#!/bin/sh
set -e

echo "Rodando migrations..."
npx prisma migrate deploy

echo "Iniciando servidor..."
exec node dist/main
