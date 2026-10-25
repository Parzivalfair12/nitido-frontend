# nítido (frontend)

Software contable para firmas de contadores en Colombia que llevan muchos clientes: lee los XML de la DIAN, propone los asientos con sus retenciones, el contador los aprueba y nítido arma los libros, los estados financieros y la exportación a Siigo. Este repositorio (`nitido-frontend`) es la aplicación web; el backend vive en el repositorio hermano `nitido-backend`.

Mockup de referencia: `docs/mockup-nitido.dc.html` (canvas «Mockup software contable», página «Prototipo nítido»). Logo: `docs/logo-nitido.svg`.

## Stack

- Angular 22, componentes standalone, signals, SCSS con los tokens del estilo Cristal (`src/styles/tokens.scss`). Fuente Geist servida desde la aplicación (`@fontsource/geist`). Código QR del doble factor con `qrcode`, dibujado en el navegador. Angular CDK no se instala todavía: se agrega cuando un componente lo necesite (diálogos, superposiciones).
- Pruebas: Vitest (unidad, con `ng test`) y Playwright (punta a punta, en `e2e/`).
- Node en la versión de `.nvmrc`.

## Comandos

```bash
npm install && npm start                      # frontend en http://localhost:4200
npm test                                      # pruebas una sola vez (Vitest)
npm run lint                                  # revisión de estilo del código
npm run lint:estilos                          # Stylelint: ningún color fuera de src/styles/tokens.scss
npm run build                                 # compila a dist/
cd e2e && npm install && npx playwright install chromium && npx playwright test   # punta a punta
```

Playwright necesita la API (http://localhost:5080) y el frontend (`npm start`) corriendo. Las llamadas a `/api` se redirigen a la API con `proxy.conf.json`.

## Reglas que nunca se rompen (las que aplican al frontend)

3. Ningún dato de un cliente se ve desde otro. Toda tabla de datos de cliente lleva `UUID_EMPRESAS` y toda consulta pasa por el filtro de multiempresa. (En pantalla: nunca mostrar ni guardar en memoria datos de un cliente al cambiar a otro.)
4. Dinero siempre `decimal` en C# y `DECIMAL(19,2)` en SQL. Nunca `double` ni `float`. (En el frontend no se hacen cálculos de dinero con `number` de coma flotante: los montos vienen calculados de la API y aquí solo se muestran.)
5. Ningún valor tributario (UVT, bases, tarifas, salario mínimo) va escrito en el código. Todo sale de los parámetros con fecha de vigencia.
8. Los textos que ve el usuario van en español de Colombia, claros y sin jerga técnica. Números con formato es-CO.

## Dónde vive cada cosa

- Backend, base de datos, especificaciones (`docs/specs`), decisiones de arquitectura (`docs/adr`) y plan de desarrollo (`docs/plan-de-desarrollo.md`): repositorio `nitido-backend` (carpeta hermana `../backend` en local).
- Agentes y skills: `.claude/` de la carpeta raíz `nitido/`, común a los dos repositorios (no se versiona con ellos).
- Contrato de la API: OpenAPI en `/openapi/v1.json` de la API (solo en Development). El plan es generar el cliente HTTP desde ese contrato; mientras tanto (pendiente), las llamadas viven en un solo lugar, `src/app/nucleo/api/`, con tipos que reflejan el contrato, y las pantallas nunca arman rutas por su cuenta.

## Cómo se trabaja

- Antes de tocar pantallas, lee la skill `diseno-cristal`. El mockup manda en distribución, textos y comportamiento.
- Componentes standalone con `ChangeDetectionStrategy.OnPush` y estado con signals. Estilos solo con los tokens CSS de Cristal, nunca colores sueltos.
- Accesibilidad: foco visible, etiqueta en todo campo, `aria-live` para mensajes, navegable con teclado. Debe verse bien a 1440 px y a 390 px sin scroll horizontal de página.
- Quien implementa no revisa; el `tester` no corrige código de producción.
- Un cambio que toca la API y una pantalla son dos pull requests coordinados: primero el del backend, después el del frontend.

## Git

- `main` siempre desplegable. Ramas `feat/<tema>` y `fix/<tema>`.
- Commits en formato Conventional Commits, en español: `feat(pendientes): mostrar el asiento propuesto`.
- Todo entra por pull request con CI en verde y revisión del agente `revisor`.

## Estructura

```
src/styles/             tokens.scss (únicos colores) y base.scss (clases del mockup)
src/app/nucleo/         servicios, guardias e interceptores; api/ con las llamadas a la API
src/app/compartido/     componentes del estilo Cristal
src/app/areas/          una carpeta de rutas por área del menú
public/                 archivos estáticos (favicon, marca)
e2e/                    Playwright (pruebas en e2e/pruebas/)
docs/                   mockup y logo
```
