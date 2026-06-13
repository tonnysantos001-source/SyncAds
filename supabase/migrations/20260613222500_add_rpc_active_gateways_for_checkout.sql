-- Migration: Add RPC function to get active gateways for checkout without exposing API credentials
CREATE OR REPLACE FUNCTION get_active_gateways_for_checkout(p_user_id text)
RETURNS TABLE (
  id uuid,
  "gatewayId" uuid,
  "isActive" boolean,
  "isDefault" boolean,
  environment text,
  gateway jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    gc."gatewayId",
    gc."isActive",
    gc."isDefault",
    gc.environment,
    jsonb_build_object(
      'id', g.id,
      'name', g.name,
      'slug', g.slug,
      'supportsPix', g."supportsPix",
      'supportsCreditCard', g."supportsCreditCard",
      'supportsBoleto', g."supportsBoleto"
    ) as gateway
  FROM "GatewayConfig" gc
  INNER JOIN "Gateway" g ON g.id = gc."gatewayId"
  WHERE gc."userId" = p_user_id AND gc."isActive" = true;
END;
$$;

-- Grant execution to public so anonymous checkout users can call it
GRANT EXECUTE ON FUNCTION get_active_gateways_for_checkout(text) TO anon, authenticated;
