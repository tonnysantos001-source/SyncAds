import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user already has a plan
    const { data: userData, error: userError } = await supabaseClient
      .from('User')
      .select('currentPlanId, id')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    // If user already has a plan, return success
    if (userData.currentPlanId) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'User already has a plan',
          alreadyHasPlan: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get free plan
    const { data: freePlan, error: planError } = await supabaseClient
      .from('Plan')
      .select('*')
      .eq('slug', 'free')
      .single();

    if (planError || !freePlan) {
      throw new Error('Free plan not found');
    }

    // Create subscription for the user
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(now.getFullYear() + 100); // 100 years for "lifetime" free plan

    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('Subscription')
      .insert({
        userId: user.id,
        planId: freePlan.id,
        status: 'active',
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: oneYearFromNow.toISOString(),
        usedAiMessages: 0,
        aiMessagesResetAt: now.toISOString(),
      })
      .select()
      .single();

    if (subscriptionError) {
      throw subscriptionError;
    }

    // Update user with plan
    const { error: updateError } = await supabaseClient
      .from('User')
      .update({
        currentPlanId: freePlan.id,
        currentSubscriptionId: subscription.id,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Free plan initialized successfully',
        subscription: subscription,
        plan: freePlan,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

