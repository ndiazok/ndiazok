"use client"

import { useState, lazy, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileEdit, Sparkles } from "lucide-react"
import Link from "next/link"

const NuevaPropiedadForm = lazy(() => import("./form"))
const SmartUploadForm = lazy(() => import("./smart-upload-form"))

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function NuevaPropiedadPage() {
  const [mode, setMode] = useState<"select" | "manual" | "smart">("select")
  const [preloadedImages, setPreloadedImages] = useState<File[]>([])

  const handleSwitchToManual = (images: File[]) => {
    setPreloadedImages(images)
    setMode("manual")
  }

  if (mode === "manual") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <NuevaPropiedadForm onBack={() => setMode("select")} initialImages={preloadedImages} />
      </Suspense>
    )
  }

  if (mode === "smart") {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <SmartUploadForm onBack={() => setMode("select")} onSwitchToManual={handleSwitchToManual} />
      </Suspense>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/propiedades">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nueva Propiedad</h1>
          <p className="text-muted-foreground">Elegí cómo querés cargar la propiedad</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
          onClick={() => setMode("manual")}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <FileEdit className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Carga Manual</CardTitle>
            <CardDescription>Completá los datos paso a paso</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Control total sobre cada campo</li>
              <li>Ideal para propiedades complejas</li>
              <li>Agregá propietarios y detalles exactos</li>
            </ul>
            <Button variant="outline" className="mt-4 w-full bg-transparent">
              Comenzar
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:border-primary hover:shadow-md border-primary/50 bg-primary/5"
          onClick={() => setMode("smart")}
        >
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              Smart Upload
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">IA</span>
            </CardTitle>
            <CardDescription>Subí fotos y la IA completa los datos</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>Análisis automático de imágenes</li>
              <li>Detecta ambientes y características</li>
              <li>Revisá y ajustá antes de guardar</li>
            </ul>
            <Button className="mt-4 w-full">
              <Sparkles className="mr-2 h-4 w-4" />
              Probar Smart Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
