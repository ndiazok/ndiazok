import { createClient } from "@supabase/supabase-js"
import { createErrorResponse } from "@/lib/errors"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const resolved = searchParams.get("resolved")
    const limit = parseInt(searchParams.get("limit") || "100")
    
    let query = supabaseAdmin
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
    
    if (type) {
      query = query.eq("error_type", type)
    }
    
    // Use status column instead of resolved
    if (resolved !== null) {
      if (resolved === "false") {
        query = query.in("status", ["new", "viewed", "investigating"])
      } else {
        query = query.in("status", ["resolved", "ignored"])
      }
    }
    
    const { data: errors, error } = await query
    
    if (error) throw error
    
    // Get stats
    const { data: stats } = await supabaseAdmin
      .from("vista_error_stats")
      .select("*")
    
    // Get grouped errors
    const { data: grouped } = await supabaseAdmin
      .from("vista_error_groups")
      .select("*")
      .limit(20)
    
    // Count unresolved by type
    const { data: unresolvedByType } = await supabaseAdmin
      .from("error_logs")
      .select("error_type")
      .in("status", ["new", "viewed", "investigating"])
    
    const typeCounts: Record<string, number> = {}
    unresolvedByType?.forEach((e) => {
      typeCounts[e.error_type] = (typeCounts[e.error_type] || 0) + 1
    })
    
    return Response.json({
      success: true,
      data: {
        errors,
        stats: stats?.[0] || { total: 0, unresolved: 0, today: 0 },
        grouped,
        typeCounts,
      },
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { error_type, error_code, message, stack_trace, url, user_agent, user_id, metadata } = body
    
    const { data, error } = await supabaseAdmin
      .from("error_logs")
      .insert({
        error_type: error_type || "unknown",
        error_code,
        message,
        stack_trace,
        url,
        user_agent,
        user_id,
        metadata,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return Response.json({ success: true, data })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { ids, resolved, resolved_by, resolution_notes } = body
    
    const { error } = await supabaseAdmin
      .from("error_logs")
      .update({
        status: resolved ? "resolved" : "new",
        resolved_by,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolution_notes,
      })
      .in("id", ids)
    
    if (error) throw error
    
    return Response.json({ success: true })
  } catch (error) {
    return createErrorResponse(error)
  }
}
