# Frontend — Sanos y Salvos

Aplicación web para reportar y recuperar mascotas perdidas o encontradas en Chile.

---

## Stack

| Herramienta | Uso |
|---|---|
| React 19 | UI |
| TypeScript 5 | Tipado estático |
| Vite | Dev server y bundler |
| Tailwind CSS | Estilos utilitarios |
| React Router v6 | Routing SPA |
| Leaflet / React-Leaflet | Mapa interactivo de reportes |
| Recharts | Gráficos en el panel de administración |
| Framer Motion | Animaciones de UI |
| Socket.io Client | Chat en tiempo real con ms-mensajeria-privada |

---

## Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (hot-reload)
npm run dev

# Build de producción
npm run build

# Previsualizar el build
npm run preview

# Linter
npm run lint

# Tests (Vitest)
npm run test:run

npm run test:coverage
```

---

## Variables de entorno

Copia `.env.example` a `.env`:

| Variable | Descripción | Valor típico local |
|---|---|---|
| `VITE_API_GATEWAY_URL` | URL del API Gateway (entrada de todas las llamadas API) | `http://localhost:8080` |
| `VITE_MS_MASCOTAS_URL` | URL directa de ms-mascotas (solo para `<img src>` de fotos) | `http://localhost:3003` |
| `VITE_MS_MENSAJERIA_URL` | URL directa de ms-mensajeria-privada (Socket.io) | `http://localhost:3006` |

> El gateway escucha en el puerto **8080**. El frontend por defecto apunta a `http://localhost:8000`, por lo que debes ajustar `VITE_API_GATEWAY_URL=http://localhost:8080` en tu `.env`.

---

## Rutas de la aplicación

Definidas en `src/App.tsx`.

### Públicas

| Ruta | Descripción |
|---|---|
| `/` | Página de inicio |
| `/login` | Inicio de sesión |
| `/register` | Registro de usuario |
| `/mapa` | Mapa interactivo de reportes (sin chatbot) |
| `/reportes` | Listado público de reportes |
| `/reportes/:id` | Detalle de un reporte |

### Privadas — `PrivateRoute` (requiere sesión)

| Ruta | Descripción |
|---|---|
| `/perfil` | Perfil del usuario autenticado |
| `/mis-reportes` | Reportes creados por el usuario |
| `/crear-reporte` | Formulario para nuevo reporte |
| `/chat` | Listado de salas de chat activas |
| `/chat/:salaId` | Sala de chat específica (Socket.io) |

### Administración — `AdminRoute` (roles: `moderador`, `administrador`, `superadmin`)

| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard con gráficos resumen |
| `/admin/usuarios` | Gestión de usuarios (búsqueda por nombre, email, RUN/RUT, teléfono) |
| `/admin/analisis/usuarios` | Análisis de registros de usuarios |
| `/admin/analisis/mascotas` | Análisis de reportes de mascotas |
| `/admin/analisis/tickets` | Análisis de tickets de soporte |
| `/admin/tickets` | Gestión de tickets de soporte |

---

## Contextos globales

| Contexto | Hook | Propósito |
|---|---|---|
| `AuthContext` | `useAuth` | Estado de autenticación, usuario, rol y tokens JWT |
| `AdminModeContext` | `useAdminMode` | Toggle del modo administrador y visibilidad del `AdminSidebar` |

---

## Notas de implementación

- **Imágenes de mascotas:** `ReportesPage`, `ReporteDetallePage` y `MapaPage` construyen las URLs de imágenes usando `VITE_MS_MASCOTAS_URL` directamente, sin pasar por el gateway. Esto evita redirigir binarios grandes por el proxy.
- **Chat en tiempo real:** `ChatDetallePage` se conecta directamente a `ms-mensajeria-privada` (`VITE_MS_MENSAJERIA_URL`) con el token JWT en `handshake.auth.token`.
- **ChatbotWidget:** se monta en todas las páginas excepto `/mapa`.
- **Datos chilenos estáticos:** regiones y comunas en `src/data/regiones-comunas.json`.
- **Roles del sistema:** `ciudadano`, `veterinaria`, `municipalidad`, `moderador`, `administrador`, `superadmin`. Los tres últimos activan el panel de administración.
