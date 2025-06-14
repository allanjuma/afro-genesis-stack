
#!/bin/bash

# Wait for database to be ready
until pg_isready -h afro-testnet-db -p 5432 -U blockscout; do
  echo "Waiting for testnet database..."
  sleep 2
done

# Wait for validator node to be ready
until curl -s http://afro-testnet-validator:8547 > /dev/null; do
  echo "Waiting for testnet validator node..."
  sleep 5
done

# Create and migrate database
MIX_ENV=prod mix ecto.create
MIX_ENV=prod mix ecto.migrate

# Start the application
exec _build/prod/rel/blockscout/bin/blockscout start
