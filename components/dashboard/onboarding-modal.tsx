"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, Building2, Users, FileText, CreditCard, ArrowRight, X } from "lucide-react"

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: string
  href: string
}

const steps: OnboardingStep[] = [
  {
    id: "property",
    title: "Agregá tu primera propiedad",
    description: "Cargá los datos de una propiedad para comenzar a administrarla.",
    icon: <Building2 className="h-6 w-6" />,
    action: "Agregar propiedad",
    href: "/dashboard/propiedades/nueva",
  },
  {
    id: "client",
    title: "Registrá un cliente",
    description: "Cargá los datos de un propietario o inquilino.",
    icon: <Users className="h-6 w-6" />,
    action: "Agregar cliente",
    href: "/dashboard/clientes/nuevo",
  },
  {
    id: "contract",
    title: "Creá un contrato",
    description: "Vinculá una propiedad con un inquilino mediante un contrato.",
    icon: <FileText className="h-6 w-6" />,
    action: "Crear contrato",
    href: "/dashboard/contratos/nuevo",
  },
  {
    id: "payment",
    title: "Generá tu primer recibo",
    description: "Emití recibos de alquiler para comenzar a cobrar.",
    icon: <CreditCard className="h-6 w-6" />,
    action: "Generar recibo",
    href: "/dashboard/cobranzas/recibos",
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch("/api/admin/onboarding")
      if (res.ok) {
        const data = await res.json()
        if (!data.completed && !data.skipped) {
          setCompletedSteps(data.steps_completed || [])
          setOpen(true)
        }
      }
    } catch (err) {
      console.error("Error checking onboarding:", err)
    } finally {
      setLoading(false)
    }
  }

  const completeStep = async (stepId: string) => {
    const newCompleted = [...completedSteps, stepId]
    setCompletedSteps(newCompleted)

    try {
      await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steps_completed: newCompleted,
          completed: newCompleted.length === steps.length,
        }),
      })

      if (newCompleted.length === steps.length) {
        setTimeout(() => setOpen(false), 1000)
      } else {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
      }
    } catch (err) {
      console.error("Error updating onboarding:", err)
    }
  }

  const skipOnboarding = async () => {
    try {
      await fetch("/api/admin/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skipped: true }),
      })
      setOpen(false)
    } catch (err) {
      console.error("Error skipping onboarding:", err)
    }
  }

  const progress = (completedSteps.length / steps.length) * 100

  if (loading) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Bienvenido a Sigma</DialogTitle>
            <Button variant="ghost" size="sm" onClick={skipOnboarding} className="text-muted-foreground">
              Omitir
              <X className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <DialogDescription>Completá estos pasos para comenzar a usar la plataforma.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">
                {completedSteps.length} de {steps.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = index === currentStep && !isCompleted

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    isCompleted
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                      : isCurrent
                        ? "bg-primary/5 border-primary"
                        : "bg-muted/30"
                  }`}
                >
                  <div
                    className={`rounded-full p-2 ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : step.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${isCompleted ? "text-emerald-700 dark:text-emerald-400" : ""}`}>
                      {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    {isCurrent && (
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          window.location.href = step.href
                          completeStep(step.id)
                        }}
                      >
                        {step.action}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
