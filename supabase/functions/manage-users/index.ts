import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Server misconfiguration: Missing API keys')
        }

        // Client to verify the caller's identity
        const userClient = createClient(
            supabaseUrl,
            supabaseServiceKey,
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Admin client for privileged operations (bypasses RLS)
        const adminClient = createClient(supabaseUrl, supabaseServiceKey)

        // Verify the caller is a supervisor or admin
        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) {
            console.error('Auth Error:', userError)
            throw new Error('Unauthorized: Invalid token')
        }

        const { data: profile, error: profileError } = await adminClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Profile Fetch Error:', profileError)
            throw new Error('Failed to fetch user profile')
        }

        if (profile?.role !== 'SUPERVISOR' && profile?.role !== 'ADMIN') {
            throw new Error('Unauthorized: Insufficient permissions')
        }

        const { action, email, password, name, role, userId } = await req.json()

        if (action === 'create') {
            console.log(`Creating user: ${name}, Role: ${role}`)

            if (role === 'USER') {
                // For 'USER' role, we don't create an Auth user, just a profile
                const { data, error } = await adminClient
                    .from('profiles')
                    .insert({
                        id: crypto.randomUUID(),
                        name,
                        role
                    })
                    .select()
                    .single()

                if (error) {
                    console.error('Creation Error (USER):', JSON.stringify(error))
                    throw error
                }

                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            } else {
                const { data, error } = await adminClient.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: { name, role }
                })

                if (error) {
                    console.error('Creation Error (Auth):', JSON.stringify(error))
                    throw error
                }

                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                })
            }
        }

        if (action === 'delete') {
            const { error } = await adminClient.auth.admin.deleteUser(userId)
            if (error) throw error
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        throw new Error('Invalid action')

    } catch (error: any) {
        console.error('Global Error:', error.message)
        return new Response(JSON.stringify({ error: error.message, details: error }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
