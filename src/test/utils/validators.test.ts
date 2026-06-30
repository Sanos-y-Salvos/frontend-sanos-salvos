import { describe, it, expect } from 'vitest';
import {
  esEmailValido,
  esTelefonoValido,
  esNombreValido,
  sanitizeNombre,
  formatDireccion,
  esRutValido,
  getPasswordReqs,
  esPasswordValida,
  validateField,
} from '../../utils/validators';

describe('esEmailValido', () => {
  it('accepts valid email', () => expect(esEmailValido('test@mail.com')).toBe(true));
  it('rejects missing @', () => expect(esEmailValido('testmail.com')).toBe(false));
  it('rejects missing domain', () => expect(esEmailValido('test@')).toBe(false));
  it('rejects empty string', () => expect(esEmailValido('')).toBe(false));
});

describe('esTelefonoValido', () => {
  it('accepts 8 digits', () => expect(esTelefonoValido('12345678')).toBe(true));
  it('rejects 7 digits', () => expect(esTelefonoValido('1234567')).toBe(false));
  it('rejects 9 digits', () => expect(esTelefonoValido('123456789')).toBe(false));
  it('rejects letters', () => expect(esTelefonoValido('1234567a')).toBe(false));
});

describe('esNombreValido', () => {
  it('accepts valid name', () => expect(esNombreValido('Juan')).toBe(true));
  it('accepts accented chars', () => expect(esNombreValido('María')).toBe(true));
  it('accepts hyphenated name', () => expect(esNombreValido('Ana-Paula')).toBe(true));
  it('rejects 2 chars', () => expect(esNombreValido('Jo')).toBe(false));
  it('rejects names with numbers', () => expect(esNombreValido('Juan1')).toBe(false));
});

describe('sanitizeNombre', () => {
  it('removes digits and symbols', () => expect(sanitizeNombre('Juan123!')).toBe('Juan'));
  it('keeps letters and spaces', () => expect(sanitizeNombre('Ana Paula')).toBe('Ana Paula'));
  it('keeps accented chars', () => expect(sanitizeNombre('María')).toBe('María'));
});

describe('formatDireccion', () => {
  it('adds comma and # when text followed by number', () => {
    expect(formatDireccion('Calle Falsa 123')).toBe('Calle Falsa, #123');
  });

  it('normalizes existing comma-hash format', () => {
    expect(formatDireccion('Calle Falsa, #123')).toBe('Calle Falsa, #123');
  });

  it('strips invalid characters', () => {
    expect(formatDireccion('Calle@Falsa')).toBe('CalleFalsa');
  });

  it('returns plain text when no number', () => {
    expect(formatDireccion('Calle Falsa')).toBe('Calle Falsa');
  });

  it('handles empty string', () => {
    expect(formatDireccion('')).toBe('');
  });
});

describe('esRutValido', () => {
  it('accepts valid RUT 8 digits', () => expect(esRutValido('11.111.111-1')).toBe(true));
  it('accepts valid RUT 7 digits', () => expect(esRutValido('1.234.567-8')).toBe(true));
  it('accepts K verifier', () => expect(esRutValido('76.354.771-K')).toBe(true));
  it('rejects short RUT', () => expect(esRutValido('123-4')).toBe(false));
  it('rejects missing dash', () => expect(esRutValido('123456789')).toBe(false));
});

describe('getPasswordReqs', () => {
  it('returns 5 requirements', () => {
    expect(getPasswordReqs('any').length).toBe(5);
  });

  it('all met for strong password', () => {
    const reqs = getPasswordReqs('Abc1!xyz');
    expect(reqs.every(r => r.met)).toBe(true);
  });

  it('length req not met for too short password', () => {
    const reqs = getPasswordReqs('Ab1!');
    const lengthReq = reqs.find(r => r.label.includes('Entre'));
    expect(lengthReq?.met).toBe(false);
  });

  it('length req not met for too long password', () => {
    const reqs = getPasswordReqs('Abc1!xyzabcdefg');
    const lengthReq = reqs.find(r => r.label.includes('Entre'));
    expect(lengthReq?.met).toBe(false);
  });

  it('uppercase req not met', () => {
    const reqs = getPasswordReqs('abc1!xyz');
    const upReq = reqs.find(r => r.label.includes('mayúscula'));
    expect(upReq?.met).toBe(false);
  });

  it('lowercase req not met', () => {
    const reqs = getPasswordReqs('ABC1!XYZ');
    const lowReq = reqs.find(r => r.label.includes('minúscula'));
    expect(lowReq?.met).toBe(false);
  });

  it('number req not met', () => {
    const reqs = getPasswordReqs('Abcd!xyz');
    const numReq = reqs.find(r => r.label.includes('número'));
    expect(numReq?.met).toBe(false);
  });

  it('special char req not met', () => {
    const reqs = getPasswordReqs('Abcd1xyz');
    const specReq = reqs.find(r => r.label.includes('especial'));
    expect(specReq?.met).toBe(false);
  });
});

describe('esPasswordValida', () => {
  it('returns true for strong password', () => expect(esPasswordValida('Abc1!xyz')).toBe(true));
  it('returns false for weak password', () => expect(esPasswordValida('abc')).toBe(false));
  it('returns false for missing special char', () => expect(esPasswordValida('Abcd1xyz')).toBe(false));
});

describe('validateField', () => {
  it('email: empty returns error', () => {
    expect(validateField('email', '')).toBe('El correo es requerido');
  });
  it('email: invalid format returns error', () => {
    expect(validateField('email', 'notanemail')).toBe('Formato de correo inválido');
  });
  it('email: valid returns empty', () => {
    expect(validateField('email', 'a@b.com')).toBe('');
  });

  it('password: empty returns error', () => {
    expect(validateField('password', '')).toBe('La contraseña es requerida');
  });
  it('password: weak returns error', () => {
    expect(validateField('password', 'abc')).toBe('La contraseña no cumple los requisitos');
  });
  it('password: valid returns empty', () => {
    expect(validateField('password', 'Abc1!xyz')).toBe('');
  });

  it('nueva_password: empty returns error', () => {
    expect(validateField('nueva_password', '')).toBe('La nueva contraseña es requerida');
  });
  it('nueva_password: valid returns empty', () => {
    expect(validateField('nueva_password', 'Abc1!xyz')).toBe('');
  });

  it('confirmPassword: empty returns error', () => {
    expect(validateField('confirmPassword', '')).toBe('Confirma tu contraseña');
  });
  it('confirmPassword: mismatch returns error', () => {
    expect(validateField('confirmPassword', 'other', { password: 'Abc1!xyz' })).toBe('Las contraseñas no coinciden');
  });
  it('confirmPassword: match returns empty', () => {
    expect(validateField('confirmPassword', 'Abc1!xyz', { password: 'Abc1!xyz' })).toBe('');
  });
  it('confirm_password: match returns empty', () => {
    expect(validateField('confirm_password', 'Abc1!xyz', { password: 'Abc1!xyz' })).toBe('');
  });

  it('telefono: empty returns error', () => {
    expect(validateField('telefono', '')).toBe('El teléfono es requerido');
  });
  it('telefono: invalid returns error', () => {
    expect(validateField('telefono', '123')).toBe('Ingresa los 8 dígitos del número (sin prefijo)');
  });
  it('telefono: valid returns empty', () => {
    expect(validateField('telefono', '12345678')).toBe('');
  });

  it('primer_nombre: empty returns error', () => {
    expect(validateField('primer_nombre', '')).toBe('El primer nombre es requerido');
  });
  it('primer_nombre: invalid returns error', () => {
    expect(validateField('primer_nombre', 'Jo')).toBe('Mínimo 3 letras, sin números ni símbolos');
  });
  it('primer_nombre: valid returns empty', () => {
    expect(validateField('primer_nombre', 'Juan')).toBe('');
  });

  it('segundo_nombre: empty returns empty (optional)', () => {
    expect(validateField('segundo_nombre', '')).toBe('');
  });
  it('segundo_nombre: invalid returns error', () => {
    expect(validateField('segundo_nombre', 'Jo')).toBe('Mínimo 3 letras, sin números ni símbolos');
  });

  it('apellido_paterno: empty returns error', () => {
    expect(validateField('apellido_paterno', '')).toBe('El primer apellido es requerido');
  });
  it('apellido_paterno: valid returns empty', () => {
    expect(validateField('apellido_paterno', 'García')).toBe('');
  });

  it('apellido_materno: empty returns empty (optional)', () => {
    expect(validateField('apellido_materno', '')).toBe('');
  });

  it('run: empty returns error', () => {
    expect(validateField('run', '')).toBe('El RUN es requerido');
  });
  it('run: invalid returns error', () => {
    expect(validateField('run', '123-4')).toBe('RUN inválido (ej: 11.111.111-1)');
  });
  it('run: valid returns empty', () => {
    expect(validateField('run', '11.111.111-1')).toBe('');
  });

  it('razon_social: empty returns error', () => {
    expect(validateField('razon_social', '')).toBe('La razón social es requerida');
  });
  it('razon_social: valid returns empty', () => {
    expect(validateField('razon_social', 'Empresa SA')).toBe('');
  });

  it('rut: empty returns error', () => {
    expect(validateField('rut', '')).toBe('El RUT es requerido');
  });
  it('rut: invalid returns error', () => {
    expect(validateField('rut', '123')).toBe('RUT inválido (ej: 76.354.771-K)');
  });
  it('rut: valid returns empty', () => {
    expect(validateField('rut', '76.354.771-K')).toBe('');
  });

  it('direccion: empty returns error', () => {
    expect(validateField('direccion', '')).toBe('La dirección es requerida');
  });
  it('direccion: valid returns empty', () => {
    expect(validateField('direccion', 'Calle Falsa, #123')).toBe('');
  });

  it('region: empty returns error', () => {
    expect(validateField('region', '')).toBe('Selecciona una región');
  });
  it('region: valid returns empty', () => {
    expect(validateField('region', '13')).toBe('');
  });

  it('comuna: empty returns error', () => {
    expect(validateField('comuna', '')).toBe('Selecciona una comuna');
  });
  it('comuna: valid returns empty', () => {
    expect(validateField('comuna', 'Santiago')).toBe('');
  });

  it('nombre_institucion: empty returns error', () => {
    expect(validateField('nombre_institucion', '')).toBe('El nombre de institución es requerido');
  });
  it('nombre_institucion: valid returns empty', () => {
    expect(validateField('nombre_institucion', 'Clínica Vet')).toBe('');
  });

  it('unknown field returns empty', () => {
    expect(validateField('unknownField', 'value')).toBe('');
  });
});

describe('validateField — missing branches', () => {
  it('nueva_password: invalid password returns error', () => {
    expect(validateField('nueva_password', 'weak')).toBe('La contraseña no cumple los requisitos');
  });
  it('apellido_paterno: invalid name returns error', () => {
    expect(validateField('apellido_paterno', 'Jo')).toBe('Mínimo 3 letras, sin números ni símbolos');
  });
  it('apellido_materno: invalid name returns error', () => {
    expect(validateField('apellido_materno', 'Jo')).toBe('Mínimo 3 letras, sin números ni símbolos');
  });
  it('nombre_institucion: invalid name returns error', () => {
    expect(validateField('nombre_institucion', 'Jo')).toBe('Mínimo 3 letras, sin números ni símbolos');
  });
  it('razon_social: invalid name returns error', () => {
    expect(validateField('razon_social', 'Jo')).toBe('Mínimo 3 letras, sin números ni símbolos');
  });
});
