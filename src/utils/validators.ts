import { parseRut } from './rutFormatter';

export const esEmailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const esTelefonoValido = (v: string) => /^\+?[0-9]{7,15}$/.test(v);
export const esNombreValido = (v: string) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,}$/.test(v.trim());
export const esRutValido = (formatted: string) => /^[0-9]{7,8}-[0-9kK]$/.test(parseRut(formatted));

export const validateField = (field: string, value: string, extra?: { password?: string }): string => {
  switch (field) {
    case 'email':
      if (!value) return 'El correo es requerido';
      if (!esEmailValido(value)) return 'Formato de correo inválido';
      return '';
    case 'password':
      if (!value) return 'La contraseña es requerida';
      if (value.length < 6) return 'Mínimo 6 caracteres';
      return '';
    case 'nueva_password':
      if (!value) return 'La nueva contraseña es requerida';
      if (value.length < 6) return 'Mínimo 6 caracteres';
      return '';
    case 'confirmPassword':
    case 'confirm_password':
      if (!value) return 'Confirma tu contraseña';
      if (value !== extra?.password) return 'Las contraseñas no coinciden';
      return '';
    case 'telefono':
      if (!value) return 'El teléfono es requerido';
      if (!esTelefonoValido(value)) return 'Solo números, con + opcional al inicio';
      return '';
    case 'primer_nombre':
      if (!value) return 'El primer nombre es requerido';
      if (!esNombreValido(value)) return 'Mínimo 3 letras, sin números ni símbolos';
      return '';
    case 'segundo_nombre':
      if (value && !esNombreValido(value)) return 'Mínimo 3 letras, sin números ni símbolos';
      return '';
    case 'apellido_paterno':
      if (!value) return 'El primer apellido es requerido';
      if (!esNombreValido(value)) return 'Mínimo 3 letras, sin números ni símbolos';
      return '';
    case 'apellido_materno':
      if (value && !esNombreValido(value)) return 'Mínimo 3 letras, sin números ni símbolos';
      return '';
    case 'run':
      if (!value) return 'El RUN es requerido';
      if (!esRutValido(value)) return 'RUN inválido (ej: 11.111.111-1)';
      return '';
    case 'nombre_institucion':
      if (!value) return 'El nombre de institución es requerido';
      if (!esNombreValido(value)) return 'Mínimo 3 letras, sin números ni símbolos';
      return '';
    case 'razon_social':
      if (!value) return 'La razón social es requerida';
      if (!esNombreValido(value)) return 'Mínimo 3 letras, sin números ni símbolos';
      return '';
    case 'rut':
      if (!value) return 'El RUT es requerido';
      if (!esRutValido(value)) return 'RUT inválido (ej: 76.354.771-K)';
      return '';
    case 'direccion':
      if (!value) return 'La dirección es requerida';
      return '';
    case 'region':
      if (!value) return 'Selecciona una región';
      return '';
    case 'comuna':
      if (!value) return 'Selecciona una comuna';
      return '';
    default:
      return '';
  }
};
