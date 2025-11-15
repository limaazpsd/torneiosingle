import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlayerSuspension {
  player_id: string
  team_id: string
  tournament_id: string
  suspension_matches_remaining: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { matchId, tournamentId } = await req.json()

    if (!matchId || !tournamentId) {
      throw new Error('matchId and tournamentId are required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Processing suspensions for match ${matchId} in tournament ${tournamentId}`)

    // Get all suspended players in this tournament
    const { data: suspendedPlayers, error: suspensionError } = await supabase
      .from('player_statistics')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('is_suspended', true)
      .gt('suspension_matches_remaining', 0)

    if (suspensionError) throw suspensionError

    console.log(`Found ${suspendedPlayers?.length || 0} suspended players`)

    // Get teams that played in this match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id')
      .eq('id', matchId)
      .single()

    if (matchError) throw matchError

    const teamsInMatch = [match.home_team_id, match.away_team_id]

    // Process each suspended player
    for (const player of suspendedPlayers || []) {
      // Check if player's team played in this match
      if (teamsInMatch.includes(player.team_id)) {
        const newRemainingMatches = player.suspension_matches_remaining - 1
        
        console.log(`Player ${player.player_id} - reducing suspension from ${player.suspension_matches_remaining} to ${newRemainingMatches}`)

        // If suspension is over
        if (newRemainingMatches <= 0) {
          const updates: any = {
            is_suspended: false,
            suspension_matches_remaining: 0,
          }

          // Reset yellow cards if suspension was due to accumulation
          if (player.yellow_cards >= 2 && player.red_cards === 0) {
            updates.yellow_cards = 0
            console.log(`Resetting yellow cards for player ${player.player_id}`)
          }

          const { error: updateError } = await supabase
            .from('player_statistics')
            .update(updates)
            .eq('id', player.id)

          if (updateError) throw updateError
        } else {
          // Just decrease the counter
          const { error: updateError } = await supabase
            .from('player_statistics')
            .update({ suspension_matches_remaining: newRemainingMatches })
            .eq('id', player.id)

          if (updateError) throw updateError
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Suspensions processed successfully',
        processedPlayers: suspendedPlayers?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing suspensions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
