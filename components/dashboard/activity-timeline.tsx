"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  FileText,
  Home,
  User,
  DollarSign,
  Wrench,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ActivityItem {
  id: string
  created_at: string
  actor_id: string | null
  actor_name: string | null
  entity_type: string
  entity_id: string
  entity_label: string | null
  action: string
  action_label: string | null
  description: string | null
  old_value: any
  new_value: any
  related_entity_type: string | null
  related_entity_id: string | null
  related_entity_label: string | null
}

interface ActivityTimelineProps {
  entityType?: string
  entityId?: string
  limit?: number
  showHeader?: boolean
}

const ENTITY_ICONS: Record<string, any> = {
  contrato: FileText,
  propiedad: Home,
  cliente: User,
  pago: DollarSign,
  liquidacion: DollarSign,
  reparacion: Wrench,
}

const ACTION_ICONS: Record<string, any> = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  status_changed: ArrowRight,
  payment_received: CheckCircle,
  payment_pending: Clock,
  approved: CheckCircle,
  rejected: AlertCircle,
}

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-700",
  updated: "bg-blue-100 text-blue-700",
  deleted: "bg-red-100 text-red-700",
  status_changed: "bg-purple-100 text-purple-700",
  payment_received: "bg-emerald-100 text-emerald-700",
  payment_pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
}

export function ActivityTimeline({ entityType, entityId, limit = 20, showHeader = true }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const params = new URLSearchParams()
        if (entityType) params.set("entityType", entityType)
        if (entityId) params.set("entityId", entityId)
        params.set("limit", limit.toString())

        const res = await fetch(`/api/admin/activity?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setActivities(data)
        }
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [entityType, entityId, limit])

  const getEntityLink = (type: string, id: string) => {
    const links: Record<string, string> = {
      contrato: `/dashboard/contratos/${id}`,
      propiedad: `/dashboard/propiedades/${id}`,
      cliente: `/dashboard/clientes/${id}`,
      pago: `/dashboard/cobranzas`,
      liquidacion: `/dashboard/liquidaciones/${id}`,
      reparacion: `/dashboard/reparaciones/${id}`,
    }
    return links[type] || "#"
  }

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-base">Actividad reciente</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Actividad reciente</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/actividad">Ver todo</Link>
          </Button>
        </CardHeader>
      )}
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Sin actividad reciente</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-6">
              {activities.map((activity, index) => {
                const EntityIcon = ENTITY_ICONS[activity.entity_type] || FileText
                const ActionIcon = ACTION_ICONS[activity.action] || Edit
                const actionColor = ACTION_COLORS[activity.action] || "bg-gray-100 text-gray-700"

                return (
                  <div key={activity.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-background`}
                    >
                      <EntityIcon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{activity.actor_name || "Sistema"}</span>{" "}
                            <span className="text-muted-foreground">{activity.action_label || activity.action}</span>{" "}
                            <Link
                              href={getEntityLink(activity.entity_type, activity.entity_id)}
                              className="font-medium hover:underline"
                            >
                              {activity.entity_label || activity.entity_type}
                            </Link>
                          </p>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          )}
                          {activity.related_entity_label && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Relacionado con:{" "}
                              <Link
                                href={getEntityLink(
                                  activity.related_entity_type || "",
                                  activity.related_entity_id || "",
                                )}
                                className="hover:underline"
                              >
                                {activity.related_entity_label}
                              </Link>
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary" className={`shrink-0 ${actionColor}`}>
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {activity.action}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
