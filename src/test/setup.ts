import '@testing-library/jest-dom'

// jsdom no implementa URL.createObjectURL — lo mockeamos globalmente
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();
