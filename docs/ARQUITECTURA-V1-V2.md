# Arquitectura acordada de StayManager

## Stack oficial del producto

### Frontend

- Angular 17.
- Componentes Standalone.
- TypeScript 5.4.
- Angular Router con lazy loading.
- Guards e interceptores funcionales.
- Bootstrap 5.3 y Bootstrap Icons.
- SweetAlert2 para mensajes y confirmaciones.
- CSS para el sistema visual propio; no se utiliza SCSS.

### Backend

- Java 17 LTS.
- Spring Boot 3.4.x.
- Spring Web.
- Spring Data JPA.
- Spring Security.
- Jakarta Validation.
- OAuth2 Resource Server con JWT firmado.
- MySQL 8.
- Flyway.
- MapStruct y Lombok.
- OpenAPI/Swagger.
- Actuator.
- Bucket4j para rate limiting.
- JUnit 5, Mockito y Testcontainers.
- Docker.

## V1: demo completa en Netlify

La V1 utiliza la configuración Angular `demo`, simula la API mediante servicios locales y persiste la información en `localStorage`. Se genera con `npm run build:demo`.

Objetivos:

- Demostrar el producto a posibles clientes.
- Validar diseño, navegación y reglas básicas.
- Permitir reservas y operación administrativa simulada.
- No asumir costos de backend durante la validación comercial.

La V1 no debe utilizarse para almacenar información real, procesar pagos reales o administrar un negocio en producción.

## V2: producto completo en Netlify y Render

La integración V2 ya se puede probar con `npm start`: Angular reenvía `/api` al backend Spring Boot mediante `proxy.conf.json`. El backend mantiene la autoridad sobre autenticación, disponibilidad, cotizaciones, reservas, pagos y métricas.

### Netlify

Hospedará el frontend Angular 17 compilado. La configuración de producción contendrá la URL pública del backend.

### Render

Hospedará el contenedor del backend Spring Boot con Java 17. El backend será la única autoridad para disponibilidad, precios, reservas, pagos, usuarios y permisos.

### Base de datos

MySQL 8 administrado. Hibernate no creará el esquema en producción; las modificaciones se aplicarán mediante migraciones Flyway versionadas.

## Repositorios

```text
staymanager-frontend
├── main             V2 conectada al backend
└── demo-netlify     V1 con servicios locales

staymanager-backend
└── main             API Spring Boot Java 17
```

## Comunicación en V2

```text
Angular 17 en Netlify
        ↓ HTTPS / JSON
Spring Boot Java 17 en Render
        ↓ JDBC / TLS
MySQL 8 administrado
```

## Seguridad de la V2

- Access token de corta duración.
- Refresh token rotativo y revocable.
- Contraseñas con BCrypt.
- CORS limitado al dominio de Netlify y al dominio comercial.
- Aislamiento multiempresa desde el usuario autenticado.
- Validación de DTO en el backend.
- Rate limiting en autenticación, disponibilidad y reservas.
- Idempotencia en pagos y webhooks.
- Auditoría de operaciones sensibles.
- Variables de entorno para secretos.
- Logs sin contraseñas, tokens ni datos financieros sensibles.

## Consideración de mantenimiento

Angular 17 se conserva porque es el stack solicitado para esta versión. Al estar fuera de soporte, la actualización futura del frontend debe permanecer en el roadmap técnico. La separación entre componentes, modelos y servicios permitirá migrar de versión sin modificar las reglas del backend Java 17.
