# StayManager · demostración pública

## Configuración de Netlify

- Rama de producción: `demo`
- Comando de compilación: `npm run build:demo`
- Directorio publicado: `dist/staymanager/browser`
- Node.js: `20`

La compilación `demo` funciona sin backend y guarda los cambios exclusivamente en `localStorage`.

## Accesos de prueba

### Administración

- Correo: `owner@demo.com`
- Contraseña: `Demo123*`

### Portal del huésped

- Código: `ST-26001`
- Correo: `laura@example.com`

## Validación previa a publicación

```bash
npm ci
npm run build:local
npm run build:demo
npm test -- --no-progress --browsers=ChromeHeadless
```

Después del despliegue se deben probar `/demo`, `/login`, `/mis-reservas`, `/admin`, `/admin/pagos`, `/admin/operacion`, `/admin/limpieza`, `/admin/alojamientos` y `/como-llegar`.
