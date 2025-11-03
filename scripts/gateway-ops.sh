#!/usr/bin/env bash
#
# SyncAds - Gateway Ops Helper
# -------------------------------------------
# cURL helpers to:
#  - Verify gateway credentials (gateway-config-verify)
#  - Run the gateway test runner (gateway-test-runner)
#  - (Optional) Trigger a process-payment example
#
# Requirements:
#  - bash, curl
#  - jq (optional, for pretty JSON)
#
# Environment variables:
#  - PROJECT_ID:      Supabase project ref (e.g. ovskepqggmxlfckxqgbr)
#  - JWT:             A valid user JWT (owner of the configs) or admin JWT
#  - BASE_URL:        Optional override. Default: https://${PROJECT_ID}.supabase.co
#
# Optional envs for verify by slug (transient credentials):
#  - STRIPE_SECRET_KEY         (sk_live_...)
#  - MP_ACCESS_TOKEN           (APP_USR-...)
#  - ASAAS_API_KEY             (Asaas API key)
#
# Usage:
#   ./gateway-ops.sh help
#   ./gateway-ops.sh verify-config <CONFIG_ID>
#   ./gateway-ops.sh verify-slug <slug> [credentials.json]
#   ./gateway-ops.sh test-self [slug1,slug2,...]
#   ./gateway-ops.sh test-all [slug1,slug2,...]         # requires super admin JWT
#   ./gateway-ops.sh process-payment <USER_ID> <ORDER_ID> <AMOUNT> <METHOD>
#
set -euo pipefail

# -------- Helpers --------
log()  { printf "[%s] %s\n" "$(date '+%H:%M:%S')" "$*" >&2; }
fail() { printf "ERROR: %s\n" "$*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

json_pp() {
  if command -v jq >/dev/null 2>&1; then jq '.'; else cat; fi
}

ensure_env() {
  [[ -n "${PROJECT_ID:-}" ]] || fail "Set PROJECT_ID env var (project ref)"
  [[ -n "${JWT:-}"        ]] || fail "Set JWT env var (user/admin access token)"
}

BASE_URL_DEFAULT="https://${PROJECT_ID:-unset}.supabase.co"
BASE_URL="${BASE_URL:-$BASE_URL_DEFAULT}"

ensure_tools() {
  need_cmd curl
}

# -------- Payload Builders --------
build_verify_payload_config() {
  local config_id="$1"
  cat <<JSON
{
  "configId": "${config_id}"
}
JSON
}

build_verify_payload_slug() {
  local slug="$1"
  local cred_file="${2:-}"

  if [[ -n "$cred_file" ]]; then
    [[ -f "$cred_file" ]] || fail "Credentials file not found: $cred_file"
    local creds
    creds="$(cat "$cred_file")"
  else
    # Build minimal credentials object from env variables
    case "$slug" in
      stripe)
        [[ -n "${STRIPE_SECRET_KEY:-}" ]] || fail "Set STRIPE_SECRET_KEY"
        creds="{\"secretKey\":\"${STRIPE_SECRET_KEY}\"}"
        ;;
      mercadopago|"mercado-pago")
        [[ -n "${MP_ACCESS_TOKEN:-}" ]] || fail "Set MP_ACCESS_TOKEN"
        creds="{\"accessToken\":\"${MP_ACCESS_TOKEN}\"}"
        ;;
      asaas)
        [[ -n "${ASAAS_API_KEY:-}" ]] || fail "Set ASAAS_API_KEY"
        creds="{\"apiKey\":\"${ASAAS_API_KEY}\"}"
        ;;
      *)
        fail "Unknown slug '$slug' and no credentials file provided"
        ;;
    esac
  fi

  cat <<JSON
{
  "slug": "${slug}",
  "credentials": ${creds},
  "persistCredentials": false
}
JSON
}

build_test_runner_payload() {
  local scope="$1"        # self|all
  local limit_slugs="$2"  # comma-separated or empty

  if [[ -n "$limit_slugs" ]]; then
    # convert "a,b,c" -> ["a","b","c"]
    IFS=',' read -r -a arr <<< "$limit_slugs"
    local json_slugs=
    for s in "${arr[@]}"; do
      if [[ -z "$json_slugs" ]]; then
        json_slugs="\"${s}\""
      else
        json_slugs+=",\"${s}\""
      fi
    done
    cat <<JSON
{
  "scope": "${scope}",
  "limitToSlugs": [ ${json_slugs} ],
  "writeAudit": true
}
JSON
  else
    cat <<JSON
{
  "scope": "${scope}",
  "writeAudit": true
}
JSON
  fi
}

build_process_payment_payload() {
  local user_id="$1"
  local order_id="$2"
  local amount="$3"
  local method="$4"     # credit_card | debit_card | pix | boleto | paypal

  # Minimal customer stub for test
  cat <<JSON
{
  "userId": "${user_id}",
  "orderId": "${order_id}",
  "amount": ${amount},
  "currency": "BRL",
  "paymentMethod": "${method}",
  "customer": {
    "name": "Cliente Teste",
    "email": "cliente+teste@example.com",
    "document": "00000000000"
  }
}
JSON
}

# -------- Commands --------
cmd_verify_config() {
  ensure_env
  ensure_tools
  local config_id="${1:-}"
  [[ -n "$config_id" ]] || fail "Usage: verify-config <CONFIG_ID>"

  log "Verificando credenciais (configId=${config_id}) em produção..."
  curl -sS -X POST \
    "${BASE_URL}/functions/v1/gateway-config-verify" \
    -H "Authorization: Bearer ${JWT}" \
    -H "Content-Type: application/json" \
    -d "$(build_verify_payload_config "$config_id")" \
  | json_pp
}

cmd_verify_slug() {
  ensure_env
  ensure_tools
  local slug="${1:-}"
  local cred_file="${2:-}"
  [[ -n "$slug" ]] || fail "Usage: verify-slug <slug> [credentials.json]"

  log "Verificando credenciais transitórias (slug=${slug}) em produção..."
  curl -sS -X POST \
    "${BASE_URL}/functions/v1/gateway-config-verify" \
    -H "Authorization: Bearer ${JWT}" \
    -H "Content-Type: application/json" \
    -d "$(build_verify_payload_slug "$slug" "$cred_file")" \
  | json_pp
}

cmd_test_self() {
  ensure_env
  ensure_tools
  local slugs="${1:-}" # comma-separated or empty
  log "Executando gateway-test-runner (scope=self)${slugs:+ com filtros: $slugs}..."
  curl -sS -X POST \
    "${BASE_URL}/functions/v1/gateway-test-runner" \
    -H "Authorization: Bearer ${JWT}" \
    -H "Content-Type: application/json" \
    -d "$(build_test_runner_payload "self" "$slugs")" \
  | json_pp
}

cmd_test_all() {
  ensure_env
  ensure_tools
  local slugs="${1:-}" # comma-separated or empty
  log "Executando gateway-test-runner (scope=all) — requer super admin..."
  curl -sS -X POST \
    "${BASE_URL}/functions/v1/gateway-test-runner" \
    -H "Authorization: Bearer ${JWT}" \
    -H "Content-Type: application/json" \
    -d "$(build_test_runner_payload "all" "$slugs")" \
  | json_pp
}

cmd_process_payment() {
  ensure_env
  ensure_tools
  local user_id="${1:-}"
  local order_id="${2:-}"
  local amount="${3:-}"
  local method="${4:-pix}"
  [[ -n "$user_id"  ]] || fail "Usage: process-payment <USER_ID> <ORDER_ID> <AMOUNT> <METHOD>"
  [[ -n "$order_id" ]] || fail "Usage: process-payment <USER_ID> <ORDER_ID> <AMOUNT> <METHOD>"
  [[ -n "$amount"   ]] || fail "Usage: process-payment <USER_ID> <ORDER_ID> <AMOUNT> <METHOD>"

  log "Disparando process-payment (usa SOMENTE gateways verificados em produção)..."
  curl -sS -X POST \
    "${BASE_URL}/functions/v1/process-payment" \
    -H "Authorization: Bearer ${JWT}" \
    -H "Content-Type: application/json" \
    -d "$(build_process_payment_payload "$user_id" "$order_id" "$amount" "$method")" \
  | json_pp
}

cmd_help() {
  cat <<'HELP'
SyncAds Gateway Ops - Help
--------------------------
Environment:
  export PROJECT_ID="ovskepqggmxlfckxqgbr"
  export JWT="eyJhbGciOi..."   # NÃO compartilhe em chats/logs
  # Opcional
  export BASE_URL="https://<PROJECT_ID>.supabase.co"

Verify (produz verificação real no provedor):
  ./gateway-ops.sh verify-config <CONFIG_ID>
  ./gateway-ops.sh verify-slug stripe               # usa STRIPE_SECRET_KEY do env
  ./gateway-ops.sh verify-slug mercadopago          # usa MP_ACCESS_TOKEN do env
  ./gateway-ops.sh verify-slug asaas                # usa ASAAS_API_KEY do env
  ./gateway-ops.sh verify-slug stripe stripe.json   # ou arquivo de credenciais

Test runner:
  ./gateway-ops.sh test-self
  ./gateway-ops.sh test-self "stripe,mercadopago,asaas"
  ./gateway-ops.sh test-all                         # requer super admin
  ./gateway-ops.sh test-all "stripe,mercadopago"

Process payment (usa apenas gateways verificados em produção):
  ./gateway-ops.sh process-payment <USER_ID> <ORDER_ID> <AMOUNT> <METHOD>
  # Example:
  ./gateway-ops.sh process-payment 00000000-0000-0000-0000-000000000000 11111111-1111-1111-1111-111111111111 100 pix

Security notes:
  - Não logue nem versione chaves/segredos.
  - Prefira variáveis de ambiente seguras ou secret managers.
  - Este script não imprime valores de credenciais.

HELP
}

# -------- Dispatcher --------
main() {
  local cmd="${1:-help}"
  shift || true
  case "$cmd" in
    verify-config)       cmd_verify_config "$@";;
    verify-slug)         cmd_verify_slug "$@";;
    test-self)           cmd_test_self "$@";;
    test-all)            cmd_test_all "$@";;
    process-payment)     cmd_process_payment "$@";;
    help|-h|--help)      cmd_help;;
    *)                   echo "Unknown command: $cmd"; echo; cmd_help; exit 1;;
  esac
}

main "$@"
