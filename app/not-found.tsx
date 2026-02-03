import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileQuestion, Home, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Página no encontrada</CardTitle>
          <CardDescription className="text-base">
            La página que busca no existe o fue movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Ir al inicio
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href="/propiedades">
                <Search className="h-4 w-4 mr-2" />
                Buscar propiedades
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            ¿Necesita ayuda? Contacte a{" "}
            <a href="mailto:info@sigma.com.ar" className="text-primary hover:underline">
              info@sigma.com.ar
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
