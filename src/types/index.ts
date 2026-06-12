export interface User {
  id: string;
  credential_id: string;
  email: string;
  telefono: string;
  foto_perfil?: string;
  rol: string;
  tipo: string;
  region: string;
  comuna: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  ciudadano?: Ciudadano;
  institucion?: Institucion;
}

export interface Ciudadano {
  id: string;
  primer_nombre: string;
  segundo_nombre?: string;
  apellido_paterno: string;
  apellido_materno?: string;
  run: string;
  direccion: string;
}

export interface Institucion {
  id: string;
  nombre_institucion: string;
  razon_social: string;
  rut: string;
  tipo_institucion: string;
  direccion: string;
}

export interface Ticket {
  id: string;
  user_id: string | null;
  email_contacto?: string;
  categoria: string;
  asunto: string;
  descripcion: string;
  estado: string;
  asignado_a?: string;
  created_at: string;
  updated_at: string;
  comentarios: Comentario[];
}

export interface Comentario {
  id: string;
  autor_id: string;
  tipo_autor: string;
  contenido: string;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PuntoMapa {
  id: string
  reporte_id: string
  tipo_reporte: 'PERDIDA' | 'ENCONTRADA'
  nombre_mascota: string | null
  latitud: number
  longitud: number
  direccion_aproximada: string | null
  descripcion: string | null
  codigo_chip: string | null
  foto_url: string | null
}