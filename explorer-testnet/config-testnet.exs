
import Config

# Database configuration
config :explorer, Explorer.Repo,
  url: System.get_env("DATABASE_URL"),
  pool_size: 20,
  timeout: 60_000,
  queue_target: 1000

# Web configuration
config :block_scout_web, BlockScoutWeb.Endpoint,
  http: [port: 4001],
  url: [host: "localhost", port: 4001],
  cache_static_manifest: "priv/static/cache_manifest.json",
  server: true,
  root: ".",
  version: Application.spec(:block_scout_web, :vsn)

# Chain configuration
config :explorer,
  coin: System.get_env("COIN", "tAFRO"),
  coin_name: System.get_env("COIN_NAME", "Testnet Afro"),
  allowed_evm_versions: ["london", "berlin", "istanbul", "petersburg", "constantinople", "byzantium", "spuriousDragon", "tangerineWhistle", "homestead"],
  include_uncles_in_average_block_time: false,
  healthy_blocks_period: :timer.minutes(5)

# JSON RPC configuration
config :explorer, :json_rpc_named_arguments,
  transport: EthereumJSONRPC.HTTP,
  transport_options: [
    http: EthereumJSONRPC.HTTP.HTTPoison,
    url: System.get_env("ETHEREUM_JSONRPC_HTTP_URL"),
    method_to_url: [
      eth_call: System.get_env("ETHEREUM_JSONRPC_HTTP_URL"),
      eth_getBalance: System.get_env("ETHEREUM_JSONRPC_HTTP_URL"),
      trace_block: System.get_env("ETHEREUM_JSONRPC_HTTP_URL"),
      trace_replayTransaction: System.get_env("ETHEREUM_JSONRPC_HTTP_URL")
    ],
    http_options: [recv_timeout: 60_000, timeout: 60_000, hackney: [pool: :ethereum_jsonrpc]]
  ],
  variant: EthereumJSONRPC.Geth

# Indexer configuration
config :indexer,
  block_interval: :timer.seconds(5),
  json_rpc_named_arguments: [
    transport: EthereumJSONRPC.HTTP,
    transport_options: [
      http: EthereumJSONRPC.HTTP.HTTPoison,
      url: System.get_env("ETHEREUM_JSONRPC_HTTP_URL"),
      http_options: [recv_timeout: 60_000, timeout: 60_000, hackney: [pool: :ethereum_jsonrpc]]
    ],
    variant: EthereumJSONRPC.Geth
  ]

# Custom branding
config :block_scout_web,
  logo: System.get_env("LOGO", "/images/afro-logo.png"),
  logo_footer: System.get_env("LOGO", "/images/afro-logo.png"),
  network_name: System.get_env("NETWORK", "Afro Testnet"),
  subnetwork: System.get_env("SUBNETWORK", "Afro Testnet")
