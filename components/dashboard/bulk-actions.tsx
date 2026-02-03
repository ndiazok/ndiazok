"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChevronDown, Loader2 } from "lucide-react"

interface BulkActionsProps {
  selectedIds: string[]
  onClearSelection: () => void
  actions: {
    label: string
    icon: React.ReactNode
    onClick: (ids: string[]) => Promise<void>
    variant?: "default" | "destructive"
    confirmMessage?: string
  }[]
}

export function BulkActions({
  selectedIds,
  onClearSelection,
  actions,
}: BulkActionsProps) {
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<(typeof actions)[0] | null>(null)

  const executeAction = async (action: (typeof actions)[0]) => {
    if (action.confirmMessage) {
      setConfirmAction(action)
      return
    }

    setLoading(true)
    try {
      await action.onClick(selectedIds)
      onClearSelection()
    } catch (err) {
      console.error("Error executing bulk action:", err)
    } finally {
      setLoading(false)
    }
  }

  const confirmAndExecute = async () => {
    if (!confirmAction) return

    setLoading(true)
    try {
      await confirmAction.onClick(selectedIds)
      onClearSelection()
    } catch (err) {
      console.error("Error executing bulk action:", err)
    } finally {
      setLoading(false)
      setConfirmAction(null)
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedIds.length} seleccionados
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <span className="mr-2">Acciones</span>}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {actions.map((action, index) => (
              <div key={index}>
                {index > 0 && action.variant === "destructive" && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => executeAction(action)}
                  className={action.variant === "destructive" ? "text-destructive" : ""}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </DropdownMenuItem>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Limpiar
        </Button>
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar accion</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmMessage?.replace("{count}", selectedIds.length.toString())}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAndExecute}
              className={confirmAction?.variant === "destructive" ? "bg-destructive text-destructive-foreground" : ""}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function BulkCheckbox({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean | "indeterminate") => void
}) {
  return (
    <Checkbox 
      checked={checked} 
      onCheckedChange={onCheckedChange} 
      onClick={(e) => e.stopPropagation()} 
    />
  )
}
