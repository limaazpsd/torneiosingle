import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamApprovedPayload {
  type: 'UPDATE';
  table: string;
  record: {
    id: string;
    tournament_id: string;
    payment_status: string;
  };
  old_record: {
    payment_status: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: TeamApprovedPayload = await req.json();
    
    console.log('Received webhook payload:', payload);

    // Verificar se é uma mudança de status para "approved"
    if (
      payload.type === 'UPDATE' &&
      payload.table === 'teams' &&
      payload.old_record.payment_status !== 'approved' &&
      payload.record.payment_status === 'approved'
    ) {
      const teamId = payload.record.id;
      const tournamentId = payload.record.tournament_id;

      console.log(`Team ${teamId} approved for tournament ${tournamentId}`);

      // Buscar informações do torneio
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('format, max_participants')
        .eq('id', tournamentId)
        .single();

      if (tournamentError) {
        console.error('Error fetching tournament:', tournamentError);
        throw tournamentError;
      }

      console.log('Tournament format:', tournament.format);

      // Verificar se já existe um sorteio para este time
      const { data: existingDraw } = await supabase
        .from('team_draws')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('team_id', teamId)
        .maybeSingle();

      if (existingDraw) {
        console.log('Draw already exists for this team');
        return new Response(JSON.stringify({ message: 'Draw already exists' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      // Sortear baseado no formato do torneio
      if (tournament.format === 'groups-knockout' || tournament.format === 'groups-only') {
        // Buscar grupos
        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('id')
          .eq('tournament_id', tournamentId)
          .order('display_order', { ascending: true });

        if (groupsError) throw groupsError;

        if (!groups || groups.length === 0) {
          console.error('No groups found for tournament');
          return new Response(
            JSON.stringify({ error: 'No groups found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Contar times em cada grupo
        const { data: existingDraws } = await supabase
          .from('team_draws')
          .select('group_id')
          .eq('tournament_id', tournamentId)
          .not('group_id', 'is', null);

        const groupCounts = new Map<string, number>();
        groups.forEach(g => groupCounts.set(g.id, 0));
        existingDraws?.forEach(draw => {
          if (draw.group_id) {
            groupCounts.set(draw.group_id, (groupCounts.get(draw.group_id) || 0) + 1);
          }
        });

        // Sortear grupo com menos times
        let selectedGroupId = groups[0].id;
        let minCount = groupCounts.get(selectedGroupId) || 0;

        groupCounts.forEach((count, groupId) => {
          if (count < minCount) {
            minCount = count;
            selectedGroupId = groupId;
          }
        });

        console.log(`Assigning team to group ${selectedGroupId}`);

        // Inserir sorteio
        const { error: drawError } = await supabase
          .from('team_draws')
          .insert({
            tournament_id: tournamentId,
            team_id: teamId,
            group_id: selectedGroupId,
          });

        if (drawError) throw drawError;

        // Adicionar time ao grupo (group_teams)
        const { error: groupTeamError } = await supabase
          .from('group_teams')
          .insert({
            group_id: selectedGroupId,
            team_id: teamId,
          });

        if (groupTeamError) throw groupTeamError;

      } else if (tournament.format === 'knockout') {
        // Buscar próxima posição disponível
        const { data: existingDraws } = await supabase
          .from('team_draws')
          .select('bracket_position')
          .eq('tournament_id', tournamentId)
          .order('bracket_position', { ascending: true });

        const usedPositions = new Set(existingDraws?.map(d => d.bracket_position) || []);
        
        // Encontrar primeira posição disponível de 1 até max_participants
        let position = 1;
        while (usedPositions.has(position) && position <= tournament.max_participants) {
          position++;
        }

        if (position > tournament.max_participants) {
          console.error('No available positions in bracket');
          return new Response(
            JSON.stringify({ error: 'Tournament is full' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log(`Assigning team to bracket position ${position}`);

        // Inserir sorteio
        const { error: drawError } = await supabase
          .from('team_draws')
          .insert({
            tournament_id: tournamentId,
            team_id: teamId,
            bracket_position: position,
          });

        if (drawError) throw drawError;

      } else if (tournament.format === 'round-robin') {
        // Para pontos corridos, apenas registrar sem posição específica
        const { error: drawError } = await supabase
          .from('team_draws')
          .insert({
            tournament_id: tournamentId,
            team_id: teamId,
          });

        if (drawError) throw drawError;
      }

      console.log('Team draw completed successfully');

      return new Response(
        JSON.stringify({ message: 'Team drawn successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'No action needed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in draw-team function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
