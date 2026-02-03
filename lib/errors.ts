// Tipos de errores personalizados
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR")
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "No autenticado") {
    super(message, 401, "AUTHENTICATION_ERROR")
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Sin permisos para realizar esta acción") {
    super(message, 403, "AUTHORIZATION_ERROR")
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Recurso") {
    super(`${resource} no encontrado`, 404, "NOT_FOUND")
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT_ERROR")
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Demasiadas solicitudes, intente más tarde") {
    super(message, 429, "RATE_LIMIT_ERROR")
  }
}

// Códigos de error con mensajes amigables
export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Los datos ingresados no son válidos",
  AUTHENTICATION_ERROR: "Debe iniciar sesión para continuar",
  AUTHORIZATION_ERROR: "No tiene permisos para realizar esta acción",
  NOT_FOUND: "El recurso solicitado no existe",
  CONFLICT_ERROR: "Conflicto con los datos existentes",
  RATE_LIMIT_ERROR: "Demasiadas solicitudes, intente más tarde",
  INTERNAL_ERROR: "Ocurrió un error inesperado",
  DATABASE_ERROR: "Error al acceder a la base de datos",
  NETWORK_ERROR: "Error de conexión, verifique su internet",
  FILE_UPLOAD_ERROR: "Error al subir el archivo",
  FILE_TOO_LARGE: "El archivo es demasiado grande",
  INVALID_FILE_TYPE: "Tipo de archivo no permitido",
}

// Función para loguear errores en la base de datos
async function logErrorToDatabase(
  errorType: string,
  errorCode: string,
  message: string,
  stackTrace?: string,
  url?: string,
  metadata?: any
) {
  try {
    // Fire and forget - no esperamos la respuesta para no bloquear
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/error_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
      },
      body: JSON.stringify({
        error_type: errorType,
        error_code: errorCode,
        message: message.substring(0, 1000), // Limitar longitud
        stack_trace: stackTrace?.substring(0, 5000),
        url,
        metadata,
      }),
    }).catch(() => {}) // Silenciar errores de logging
  } catch {
    // No hacer nada si falla el logging
  }
}

// Helper para crear respuestas de error consistentes
export function createErrorResponse(error: unknown, requestUrl?: string) {
  console.error("[API Error]", error)

  let errorType = "unknown"
  let errorCode = "INTERNAL_ERROR"
  let message = "Error desconocido"
  let statusCode = 500
  let stackTrace: string | undefined

  if (error instanceof AppError) {
    errorType = error.code.toLowerCase().replace("_error", "")
    errorCode = error.code
    message = error.message
    statusCode = error.statusCode
    stackTrace = error.stack
  } else if (typeof error === "object" && error !== null && "code" in error) {
    // Error de Supabase
    const supabaseError = error as { code: string; message?: string; details?: string }
    errorType = "database"
    errorCode = supabaseError.code
    message = supabaseError.message || "Error de base de datos"
    statusCode = getSupabaseErrorStatus(supabaseError.code)
  } else if (error instanceof Error) {
    message = error.message
    stackTrace = error.stack
  }

  // Loguear en base de datos (solo errores de servidor, no validaciones)
  if (statusCode >= 500) {
    logErrorToDatabase(errorType, errorCode, message, stackTrace, requestUrl)
  }

  return Response.json(
    {
      success: false,
      error: {
        code: errorCode,
        message: process.env.NODE_ENV === "development" || statusCode < 500 
          ? message 
          : "Ocurrió un error inesperado",
      },
    },
    { status: statusCode }
  )
}

function getSupabaseErrorStatus(code: string): number {
  const statusMap: Record<string, number> = {
    "23505": 409, // unique violation
    "23503": 400, // foreign key violation
    "23502": 400, // not null violation
    "22P02": 400, // invalid text representation
    "42501": 403, // permission denied
    "PGRST116": 404, // not found
  }
  return statusMap[code] || 500
}

// Wrapper para handlers de API con manejo de errores
export function withErrorHandler(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any): Promise<Response> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return createErrorResponse(error)
    }
  }
}

// Helper para validar campos requeridos
export function validateRequired(data: Record<string, any>, fields: string[]): void {
  const missing = fields.filter((field) => {
    const value = data[field]
    return value === undefined || value === null || value === ""
  })
  
  if (missing.length > 0) {
    throw new ValidationError(`Campos requeridos: ${missing.join(", ")}`)
  }
}

// Helper para validar email
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError("Email inválido")
  }
}

// Helper para validar CUIT argentino
export function validateCUIT(cuit: string): void {
  const cleanCuit = cuit.replace(/[-\s]/g, "")
  if (!/^\d{11}$/.test(cleanCuit)) {
    throw new ValidationError("CUIT inválido (debe tener 11 dígitos)")
  }
}

// Helper para validar DNI argentino
export function validateDNI(dni: string): void {
  const cleanDni = dni.replace(/[.\s]/g, "")
  if (!/^\d{7,8}$/.test(cleanDni)) {
    throw new ValidationError("DNI inválido (debe tener 7-8 dígitos)")
  }
}
