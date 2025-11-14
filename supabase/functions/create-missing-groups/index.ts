import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tournament_id } = await req.json();

    if (!tournament_id) {
      return new Response(
        JSON.stringify({ error: 'tournament_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do torneio
    const { data: tournament, error: tournamentError } = await supabaseClient
      .from('tournaments')
      .select('id, max_participants, format')
      .eq('id', tournament_id)
      .single();

    if (tournamentError) throw tournamentError;

    // Verificar se já tem grupos
    const { count: existingGroupsCount } = await supabaseClient
      .from('groups')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament_id);

    if (existingGroupsCount && existingGroupsCount > 0) {
      return new Response(
        JSON.stringify({ message: 'Groups already exist for this tournament', groups_created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular número de grupos baseado em max_participants
    const calculateNumGroups = (maxParticipants: number): number => {
      if (maxParticipants <= 8) return 2;      // 4 times por grupo
      if (maxParticipants <= 16) return 4;     // 4 times por grupo
      if (maxParticipants <= 24) return 4;     // 6 times por grupo
      if (maxParticipants <= 32) return 8;     // 4 times por grupo
      return 4; // padrão
    };

    const numGroups = calculateNumGroups(tournament.max_participants);
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    const groupsToInsert = Array.from({ length: numGroups }, (_, i) => ({
      tournament_id: tournament_id,
      name: `Grupo ${groupLetters[i]}`,
      display_order: i + 1
    }));

    const { error: insertError } = await supabaseClient
      .from('groups')
      .insert(groupsToInsert);

    if (insertError) throw insertError;

    console.log(`Created ${numGroups} groups for tournament ${tournament_id}`);

    return new Response(
      JSON.stringify({ 
        message: 'Groups created successfully', 
        groups_created: numGroups 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error creating groups:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
