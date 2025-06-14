
#!/bin/bash

# Wait for database to be ready
until pg_isready -h afro-db -p 5432 -U blockscout; do
  echo "Waiting for database..."
  sleep 2
done

# Wait for validator node to be ready
until curl -s http://afro-validator:8545 > /dev/null; do
  echo "Waiting for validator node..."
  sleep 5
done

# Create and migrate database
MIX_ENV=prod mix ecto.create
MIX_ENV=prod mix ecto.migrate

# Start the application
exec _build/prod/rel/blockscout/bin/blockscout start
