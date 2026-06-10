#!/bin/sh
set -e

# Fix storage volume ownership so the nextjs user (uid 1001) can write to it.
# This runs as root before privilege drop, so it works even when the Docker
# volume is newly created and owned by root.
mkdir -p /app/storage
chown -R nextjs:nodejs /app/storage

# Drop to nextjs user for all subsequent processes (Node.js, startup scripts).
exec su-exec nextjs "$@"
