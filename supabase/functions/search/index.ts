import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search across multiple tables
    const searchTerm = `%${query.toLowerCase()}%`;

    const [roomsRes, startupsRes, eventsRes] = await Promise.all([
      supabase
        .from('rooms')
        .select('id, name, description, hub, member_count')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from('startups')
        .select('id, name, description, stage, hub')
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
      supabase
        .from('events')
        .select('id, title, description, event_type, event_date')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .limit(5),
    ]);

    const results = {
      rooms: roomsRes.data || [],
      startups: startupsRes.data || [],
      events: eventsRes.data || [],
    };

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in search function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
