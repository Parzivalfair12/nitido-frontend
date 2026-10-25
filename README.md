# nítido (frontend)

Aplicación web de nítido, software contable para firmas de contadores en Colombia. Lee los XML de la DIAN, propone los asientos y deja que el contador los apruebe. Este repositorio (`nitido-frontend`) tiene solo la parte web, hecha con Angular 22; la API y la base de datos están en el repositorio hermano `nitido-backend`.

Estado actual: fase 0 (fundaciones). Están el sistema de diseño Cristal, la pantalla de ingreso (con doble factor) y la pantalla de Clientes. Las reglas de trabajo están en [CLAUDE.md](CLAUDE.md).

## Requisitos

- **Node.js** en la versión que indica `.nvmrc` (24). Con `node --version` debe aparecer `v24.x`. Trae `npm`.
- Para probar contra datos reales: el repositorio `nitido-backend` y el SDK de .NET 10 (ver el README de ese repositorio).

## Primera vez

```bash
npm install
```

## Cómo arrancar

1. Arranca la API desde el repositorio backend (en otra terminal):

   ```bash
   dotnet run --project Nitido.Api
   ```

   La API queda en http://localhost:5080. Para comprobarla, abre http://localhost:5080/salud: debe responder `Healthy`.

2. En este repositorio:

   ```bash
   npm start
   ```

   La aplicación queda en http://localhost:4200. Las llamadas a `/api` se redirigen a http://localhost:5080 (ver `proxy.conf.json`), así que deja la API corriendo mientras trabajas.

## Comandos

| Para qué | Comando |
| --- | --- |
| Arrancar en http://localhost:4200 | `npm start` |
| Correr las pruebas una sola vez | `npm test` |
| Correr las pruebas en modo observador | `npm run test:observar` |
| Revisar el estilo del código | `npm run lint` |
| Revisar que no haya colores fuera de los tokens | `npm run lint:estilos` |
| Compilar (queda en `dist/`) | `npm run build` |

### Pruebas de punta a punta (Playwright)

Necesitan la API y el frontend corriendo (pasos de arriba). Desde este repositorio:

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

Por defecto prueban http://localhost:4200; se puede cambiar con la variable `NITIDO_URL`. El informe queda en `e2e/playwright-report/`.

Detalles que conviene saber:

- La API debe correr en **Development** (ahí el registro de firmas está habilitado y la API deja ver el contrato OpenAPI) y con una base de datos con las migraciones aplicadas.
- La API limita a 10 las peticiones por minuto a `/api/autenticacion/*` desde la misma IP. Los flujos de las pruebas hacen más, así que arranca la API con `Seguridad__LimitePeticiones__PorMinuto=1000` (variable de entorno).
- Las capturas de referencia (`toHaveScreenshot`) están en `e2e/pruebas/*-snapshots/`. Se generan con `npx playwright test --update-snapshots=all` y las aprueba una persona frente al mockup.
- Se corre con un solo proceso (`workers: 1`) porque todas las pruebas usan la misma API y la misma base.

## Estructura

```
src/app/nucleo/         servicios, guardias e interceptores
src/app/compartido/     componentes del estilo Cristal
src/app/areas/          una carpeta de rutas por área del menú
public/                 archivos estáticos
e2e/                    pruebas de Playwright
docs/                   mockup y logo
```

## Integración continua

El workflow `.github/workflows/ci.yml` (nombre `CI`) corre en cada pull request hacia `main`, al unir a `main` y a mano desde la pestaña Actions («Run workflow»). Tiene un solo trabajo, llamado `frontend`, en un runner `ubuntu-24.04`. Ese nombre es el check que debe exigir la protección de `main`; no lo cambies sin actualizar la regla antes. Si subes cambios nuevos al mismo pull request, GitHub cancela la corrida anterior de ese pull request; no cancela la corrida en curso de `main`.

Qué hace, en este orden, y se detiene en el primer paso que falle:

1. Instala Node en la versión de `.nvmrc` (con caché de npm).
2. `npm ci`
3. `npm run lint`
4. `npm run --if-present lint:estilos` (no hace nada hasta que exista ese comando, con la historia F0-05a)
5. `npm test`
6. `npm run build`

No corre las pruebas de Playwright ni usa secretos. Para reproducirlo en tu computador, desde la raíz de este repositorio:

```bash
npm ci && npm run lint && npm run --if-present lint:estilos && npm test && npm run build
```

La protección de `main` no se crea sola: se configura a mano en GitHub (Settings, Rules, Rulesets), exigiendo pull request y el check `frontend` en verde. GitHub solo ofrece un check después de que haya corrido al menos una vez, así que se configura después de la primera corrida. En repositorios privados, la protección de ramas necesita GitHub Pro o Team.

## Despliegue

En la fase 0 no hay despliegue.

## Repositorios

- Backend (API, base de datos, especificaciones, decisiones de arquitectura y plan de desarrollo): `nitido-backend`.
