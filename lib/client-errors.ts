"use client"

import { toast } from "@/hooks/use-toast"

// Tipos de respuesta de API
interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: string
  }
}

interface ApiSuccessResponse<T> {
  success: true
  data: T
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Mensajes amigables por código de error
const FRIENDLY_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Por favor, revise los datos ingresados",
  AUTHENTICATION_ERROR: "Su sesión expiró, por favor inicie sesión nuevamente",
  AUTHORIZATION_ERROR: "No tiene permisos para realizar esta acción",
  NOT_FOUND: "No se encontró lo que buscaba",
  CONFLICT_ERROR: "Ya existe un registro con estos datos",
  RATE_LIMIT_ERROR: "Demasiadas solicitudes, espere un momento",
  INTERNAL_ERROR: "Ocurrió un error, intente nuevamente",
  DATABASE_ERROR: "Error al guardar los datos",
  NETWORK_ERROR: "Error de conexión, verifique su internet",
  FILE_UPLOAD_ERROR: "Error al subir el archivo",
  FILE_TOO_LARGE: "El archivo excede el tamaño máximo permitido",
  INVALID_FILE_TYPE: "Tipo de archivo no permitido",
}

// Helper para hacer fetch con manejo de errores
export async function fetchWithError<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options)
    
    // Si no hay contenido, retornar vacío
    if (response.status === 204) {
      return {} as T
    }

    const data = await response.json()

    // Si la respuesta tiene formato de error
    if (!response.ok || data.success === false) {
      const errorData = data as ApiErrorResponse
      const friendlyMessage = FRIENDLY_MESSAGES[errorData.error?.code] || errorData.error?.message || "Error desconocido"
      
      throw new ClientApiError(
        friendlyMessage,
        errorData.error?.code || "UNKNOWN_ERROR",
        response.status,
        errorData.error?.details
      )
    }

    // Si la respuesta tiene formato success, extraer data
    if (data.success === true) {
      return (data as ApiSuccessResponse<T>).data
    }

    // Si es respuesta directa sin wrapper
    return data as T
  } catch (error) {
    if (error instanceof ClientApiError) {
      throw error
    }

    // Error de red
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ClientApiError(
        "Error de conexión, verifique su internet",
        "NETWORK_ERROR",
        0
      )
    }

    throw new ClientApiError(
      error instanceof Error ? error.message : "Error desconocido",
      "UNKNOWN_ERROR",
      500
    )
  }
}

// Error de cliente personalizado
export class ClientApiError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: string

  constructor(message: string, code: string, statusCode: number, details?: string) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

// Helper para mostrar errores con toast
export function showError(error: unknown, fallbackMessage = "Ocurrió un error"): void {
  let message = fallbackMessage
  let description: string | undefined

  if (error instanceof ClientApiError) {
    message = error.message
    description = error.details
  } else if (error instanceof Error) {
    message = error.message
  }

  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  })

  // Log para debugging
  console.error("[Client Error]", error)
}

// Helper para mostrar éxito con toast
export function showSuccess(message: string, description?: string): void {
  toast({
    title: "Éxito",
    description: message,
  })
}

// Helper para mostrar advertencia con toast
export function showWarning(message: string, description?: string): void {
  toast({
    title: "Atención",
    description: message,
  })
}

// Hook-like function para manejar operaciones async con loading y errores
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string
    errorMessage?: string
    onSuccess?: (data: T) => void
    onError?: (error: ClientApiError) => void
  }
): Promise<T | null> {
  try {
    const result = await operation()
    
    if (options?.successMessage) {
      showSuccess(options.successMessage)
    }
    
    options?.onSuccess?.(result)
    return result
  } catch (error) {
    const apiError = error instanceof ClientApiError 
      ? error 
      : new ClientApiError(
          options?.errorMessage || "Ocurrió un error",
          "UNKNOWN_ERROR",
          500
        )
    
    showError(apiError, options?.errorMessage)
    options?.onError?.(apiError)
    return null
  }
}

// Wrapper para formularios con validación
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Partial<Record<keyof T, (value: any) => string | null>>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {}
  
  for (const [field, validator] of Object.entries(rules)) {
    if (validator) {
      const error = validator(data[field])
      if (error) {
        errors[field as keyof T] = error
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Validadores comunes
export const validators = {
  required: (fieldName: string) => (value: any) => {
    if (value === undefined || value === null || value === "") {
      return `${fieldName} es requerido`
    }
    return null
  },
  
  email: (value: string) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : "Email inválido"
  },
  
  minLength: (min: number, fieldName: string) => (value: string) => {
    if (!value) return null
    return value.length >= min ? null : `${fieldName} debe tener al menos ${min} caracteres`
  },
  
  maxLength: (max: number, fieldName: string) => (value: string) => {
    if (!value) return null
    return value.length <= max ? null : `${fieldName} no puede exceder ${max} caracteres`
  },
  
  dni: (value: string) => {
    if (!value) return null
    const cleanDni = value.replace(/[.\s]/g, "")
    return /^\d{7,8}$/.test(cleanDni) ? null : "DNI inválido (7-8 dígitos)"
  },
  
  cuit: (value: string) => {
    if (!value) return null
    const cleanCuit = value.replace(/[-\s]/g, "")
    return /^\d{11}$/.test(cleanCuit) ? null : "CUIT inválido (11 dígitos)"
  },
  
  phone: (value: string) => {
    if (!value) return null
    const cleanPhone = value.replace(/[\s-()]/g, "")
    return /^\+?\d{8,15}$/.test(cleanPhone) ? null : "Teléfono inválido"
  },
}
