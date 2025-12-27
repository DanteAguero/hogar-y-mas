#!/bin/sh

set -e

host="$1"
shift
cmd="$@"

until pg_isready -h "$host" -p 5432; do
  echo "PostgreSQL aún no está listo..."
  sleep 1
done

echo "PostgreSQL está listo, iniciando backend!"
exec $cmd
