"use client"

import { useState, useEffect } from "react"
import { X, Plus, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import Link from "next/link"

interface Property {
  id: string
  direccion: string
  ciudad: string
  tipo: string
  dormitorios: number | null
  banos: number | null
  metros_cuadrados: number | null
  precio_alquiler: number | null
  moneda_alquiler: string | null
  precio_venta: number | null
  moneda_venta: string | null
  en_alquiler: boolean
  en_venta: boolean
  images?: { url: string }[]
}

interface PropertyComparatorProps {
  allProperties: Property[]
}

export function PropertyComparator({ allProperties = [] }: PropertyComparatorProps) {
  const [compareList, setCompareList] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Cargar lista del localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sigma_compare")
    if (saved) {
      setCompareList(JSON.parse(saved))
    }
  }, [])

  // Guardar lista en localStorage
  useEffect(() => {
    localStorage.setItem("sigma_compare", JSON.stringify(compareList))
  }, [compareList])

  const addToCompare = (id: string) => {
    if (compareList.length < 3 && !compareList.includes(id)) {
      setCompareList([...compareList, id])
    }
  }

  const removeFromCompare = (id: string) => {
    setCompareList(compareList.filter((i) => i !== id))
  }

  const clearCompare = () => {
    setCompareList([])
  }

  const isInCompare = (id: string) => compareList.includes(id)

  const compareProperties = allProperties.filter((p) => compareList.includes(p.id))

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return "-"
    const symbol = currency === "USD" ? "USD " : "$ "
    return symbol + price.toLocaleString("es-AR")
  }

  return (
    <>
      {/* Botón flotante para comparar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="shadow-lg gap-2">
                <ArrowLeftRight className="h-4 w-4" />
                Comparar ({compareList.length})
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  <span>Comparar propiedades</span>
                  <Button variant="ghost" size="sm" onClick={clearCompare}>
                    Limpiar
                  </Button>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="text-left p-2 w-32"></th>
                      {compareProperties.map((p) => (
                        <th key={p.id} className="p-2 min-w-[200px]">
                          <Card className="p-3 relative">
                            <button
                              className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
                              onClick={() => removeFromCompare(p.id)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            {p.images?.[0] ? (
                              <Image
                                src={p.images[0].url || "/placeholder.svg"}
                                alt={p.direccion}
                                width={180}
                                height={120}
                                className="w-full h-24 object-cover rounded mb-2"
                              />
                            ) : (
                              <div className="w-full h-24 bg-muted rounded mb-2" />
                            )}
                            <Link
                              href={`/propiedades/${p.id}`}
                              className="font-medium text-sm hover:underline line-clamp-1"
                            >
                              {p.direccion}
                            </Link>
                            <p className="text-xs text-muted-foreground">{p.ciudad}</p>
                          </Card>
                        </th>
                      ))}
                      {compareList.length < 3 && (
                        <th className="p-2 min-w-[200px]">
                          <Card className="p-3 h-full min-h-[160px] border-dashed flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                              <Plus className="h-8 w-8 mx-auto mb-2" />
                              <p className="text-sm">Agregar propiedad</p>
                            </div>
                          </Card>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-2 font-medium text-sm">Tipo</td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-2 text-sm text-center">
                          {p.tipo || "-"}
                        </td>
                      ))}
                      {compareList.length < 3 && <td />}
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium text-sm">Precio Venta</td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-2 text-sm text-center font-semibold">
                          {p.en_venta ? formatPrice(p.precio_venta, p.moneda_venta) : "-"}
                        </td>
                      ))}
                      {compareList.length < 3 && <td />}
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium text-sm">Precio Alquiler</td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-2 text-sm text-center font-semibold">
                          {p.en_alquiler ? formatPrice(p.precio_alquiler, p.moneda_alquiler) + "/mes" : "-"}
                        </td>
                      ))}
                      {compareList.length < 3 && <td />}
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium text-sm">Dormitorios</td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-2 text-sm text-center">
                          {p.dormitorios || "-"}
                        </td>
                      ))}
                      {compareList.length < 3 && <td />}
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium text-sm">Baños</td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-2 text-sm text-center">
                          {p.banos || "-"}
                        </td>
                      ))}
                      {compareList.length < 3 && <td />}
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium text-sm">Superficie</td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-2 text-sm text-center">
                          {p.metros_cuadrados ? `${p.metros_cuadrados} m²` : "-"}
                        </td>
                      ))}
                      {compareList.length < 3 && <td />}
                    </tr>
                    <tr className="border-t">
                      <td className="p-2 font-medium text-sm">Acción</td>
                      {compareProperties.map((p) => (
                        <td key={p.id} className="p-2 text-center">
                          <Link href={`/propiedades/${p.id}`}>
                            <Button size="sm" variant="outline">
                              Ver detalle
                            </Button>
                          </Link>
                        </td>
                      ))}
                      {compareList.length < 3 && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Exportar funciones para usar en otros componentes */}
      <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, isInCompare }}>
        {/* Children si fuera necesario */}
      </CompareContext.Provider>
    </>
  )
}

// Context para compartir estado de comparación
import { createContext, useContext } from "react"

interface CompareContextType {
  compareList: string[]
  addToCompare: (id: string) => void
  removeFromCompare: (id: string) => void
  isInCompare: (id: string) => boolean
}

const CompareContext = createContext<CompareContextType | null>(null)

export function useCompare() {
  const context = useContext(CompareContext)
  if (!context) {
    // Retornar valores por defecto si no hay contexto
    return {
      compareList: [],
      addToCompare: () => {},
      removeFromCompare: () => {},
      isInCompare: () => false,
    }
  }
  return context
}

// Hook para manejar comparación desde cualquier componente
export function usePropertyCompare() {
  const [compareList, setCompareList] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("sigma_compare")
    if (saved) {
      setCompareList(JSON.parse(saved))
    }

    // Escuchar cambios en localStorage
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "sigma_compare" && e.newValue) {
        setCompareList(JSON.parse(e.newValue))
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const addToCompare = (id: string) => {
    const newList = compareList.length < 3 && !compareList.includes(id) ? [...compareList, id] : compareList
    setCompareList(newList)
    localStorage.setItem("sigma_compare", JSON.stringify(newList))
  }

  const removeFromCompare = (id: string) => {
    const newList = compareList.filter((i) => i !== id)
    setCompareList(newList)
    localStorage.setItem("sigma_compare", JSON.stringify(newList))
  }

  const isInCompare = (id: string) => compareList.includes(id)

  return { compareList, addToCompare, removeFromCompare, isInCompare }
}
