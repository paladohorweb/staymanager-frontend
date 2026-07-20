# JGMSOLUTIONS StayManager — frontend dual

Aplicación Angular 17 para administrar alojamientos turísticos. Un mismo código fuente ofrece dos perfiles independientes:

| Modo | Comando | Persistencia | Uso |
|---|---|---|---|
| Local API | `npm start` | Spring Boot + MySQL | Desarrollo full stack |
| Demo | `npm run start:demo` | `localStorage` | Demostraciones sin backend |
| Netlify demo | `npm run build:demo` | `localStorage` | Despliegue público de V1 |

## Tecnología

- Angular 17.3 Standalone y TypeScript 5.4.
- Bootstrap 5.3 y Bootstrap Icons mediante CSS.
- SweetAlert2 para mensajes, errores, confirmaciones y notificaciones.
- CSS personalizado en `src/styles.css`; no se utiliza SCSS.
- HttpClient, interceptor JWT y renovación automática del access token.
- Configuraciones Angular separadas mediante `fileReplacements`.

## 1. Modo local conectado al backend Java

Requisitos:

- Node.js 20 LTS y npm 10+.
- Java 17.
- Backend StayManager.
- MySQL 8, recomendado mediante Docker.

Desde la carpeta del backend:

```bash
docker compose up -d mysql
./mvnw spring-boot:run
```

En Windows PowerShell utiliza `./mvnw.cmd spring-boot:run`.

Verifica:

- Health: `http://localhost:8080/actuator/health`
- Swagger: `http://localhost:8080/swagger-ui.html`

Después, desde esta carpeta:

```bash
npm install
npm start
```

Abre `http://localhost:4200`. El archivo `proxy.conf.json` reenvía `/api` hacia `http://localhost:8080`.

## 2. Probar el modo demo localmente

No necesita Java, MySQL ni backend:

```bash
npm install
npm run start:demo
```

Los cambios se guardan en el navegador. En el dashboard está disponible la acción **Restaurar demo**.

## Credenciales en ambos modos

```text
Correo: owner@demo.com
Contraseña: Demo123*
```

## 3. Desplegar la demo en Netlify desde GitHub

El archivo `netlify.toml` ya contiene:

```toml
[build]
  command = "npm run build:demo"
  publish = "dist/staymanager/browser"
```

Procedimiento:

1. Publica el contenido del proyecto en GitHub.
2. En Netlify selecciona **Add new site → Import an existing project**.
3. Selecciona el repositorio.
4. No reemplaces el comando detectado desde `netlify.toml`.
5. Ejecuta el despliegue.

La regla SPA está incluida en `public/_redirects`, por lo que rutas como `/admin/reservas` funcionan también al actualizar el navegador.

## Compilaciones

API local o futura integración con Render:

```bash
npm run build:local
```

Demo autosuficiente para Netlify:

```bash
npm run build:demo
```

Ambas generan:

```text
dist/staymanager/browser
```

## Separación de configuración

```text
src/environments/environment.ts       demoMode: false
src/environments/environment.demo.ts  demoMode: true
```

Netlify reemplaza el archivo de entorno durante `build:demo`. No se detecta el modo mediante el dominio ni mediante lógica improvisada en tiempo de ejecución.

## Funcionalidades del modo demo

- Catálogo público y búsqueda por capacidad.
- Disponibilidad sin reservas superpuestas.
- Cotización por noches de semana y fin de semana.
- Creación de reservas.
- Login administrativo.
- Dashboard e indicadores.
- Cambios de estado de reservas.
- Creación de alojamientos.
- Registro de pagos y actualización de saldos.
- Persistencia y restauración del conjunto inicial.

## Seguridad y alcance

El modo demo no debe utilizarse para información real: sus datos y sesión existen únicamente en el navegador. El modo local sí delega reglas, seguridad y persistencia en Spring Boot.

Angular 17.3.12 se conserva por requisito del proyecto. Esta rama tiene avisos de seguridad publicados sin corrección disponible dentro de Angular 17, por lo que la actualización de versión mayor debe mantenerse en el roadmap antes de una salida productiva.
