import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { tournament_id } = await req.json();

    if (!tournament_id) {
      return new Response(
        JSON.stringify({ error: 'tournament_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Populating draws for tournament:', tournament_id);

    // Buscar torneio
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('format, max_participants')
      .eq('id', tournament_id)
      .single();

    if (tournamentError) throw tournamentError;

    // Buscar times aprovados
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id')
      .eq('tournament_id', tournament_id)
      .eq('payment_status', 'approved');

    if (teamsError) throw teamsError;

    if (!teams || teams.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No approved teams found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Verificar se já existem sorteios
    const { data: existingDraws } = await supabase
      .from('team_draws')
      .select('id')
      .eq('tournament_id', tournament_id);

    if (existingDraws && existingDraws.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Draws already exist for this tournament' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${teams.length} teams to draw`);

    // Sortear baseado no formato
    if (tournament.format === 'groups-knockout' || tournament.format === 'groups-only') {
      // Buscar grupos
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id')
        .eq('tournament_id', tournament_id)
        .order('display_order', { ascending: true });

      if (groupsError) throw groupsError;

      if (!groups || groups.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No groups found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Embaralhar times para distribuição aleatória
      const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

      // Distribuir times nos grupos de forma balanceada
      for (let i = 0; i < shuffledTeams.length; i++) {
        const groupIndex = i % groups.length;
        const groupId = groups[groupIndex].id;
        const teamId = shuffledTeams[i].id;

        // Inserir sorteio
        const { error: drawError } = await supabase
          .from('team_draws')
          .insert({
            tournament_id: tournament_id,
            team_id: teamId,
            group_id: groupId,
          });

        if (drawError) throw drawError;

        // Adicionar ao group_teams se ainda não existir
        const { error: groupTeamError } = await supabase
          .from('group_teams')
          .insert({
            group_id: groupId,
            team_id: teamId,
          })
          .select()
          .maybeSingle();

        // Ignorar erro de duplicação
        if (groupTeamError && !groupTeamError.message.includes('duplicate')) {
          console.error('Error adding team to group:', groupTeamError);
        }
      }

      console.log(`Distributed ${shuffledTeams.length} teams across ${groups.length} groups`);

    } else if (tournament.format === 'knockout') {
      // Para mata-mata, sortear posições aleatoriamente
      const positions = Array.from({ length: teams.length }, (_, i) => i + 1);
      const shuffledPositions = positions.sort(() => Math.random() - 0.5);

      for (let i = 0; i < teams.length; i++) {
        const { error: drawError } = await supabase
          .from('team_draws')
          .insert({
            tournament_id: tournament_id,
            team_id: teams[i].id,
            bracket_position: shuffledPositions[i],
          });

        if (drawError) throw drawError;
      }

      console.log(`Assigned ${teams.length} teams to bracket positions`);

    } else if (tournament.format === 'round-robin' || tournament.format === 'league') {
      // Para pontos corridos, apenas registrar
      for (const team of teams) {
        const { error: drawError } = await supabase
          .from('team_draws')
          .insert({
            tournament_id: tournament_id,
            team_id: team.id,
          });

        if (drawError) throw drawError;
      }

      console.log(`Registered ${teams.length} teams for round-robin`);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Draws populated successfully', 
        teams_processed: teams.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in populate-draws function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
