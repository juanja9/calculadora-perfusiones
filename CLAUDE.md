# CLAUDE.md

Calculadora web de perfusiones de vasoactivos (ml/h) que acompaña al protocolo de shock distributivo, versión 1.0. El autor es médico anestesiólogo y no programa: explica cada cambio en lenguaje sencillo.

## Estructura

- `index.html`: toda la app (HTML, CSS y JS en un solo archivo, sin dependencias ni build). Debe seguir siendo un único archivo autocontenido, usable en iPhone/iPad.
- Los fármacos, diluciones, rangos y avisos están en el array `DRUGS`; las fórmulas en `doseToRate` y `rateToDose`.
- Se publica con GitHub Pages desde `main`: https://juanja9.github.io/calculadora-perfusiones/

## Seguridad clínica (obligatorio)

- No cambies fármacos, diluciones, dosis, unidades, umbrales de aviso ni fórmulas sin aprobación explícita del autor.
- Todo cambio de ese tipo se justifica con ficha técnica o evidencia de calidad y se verifica con cálculos de ejemplo antes y después.
- La fuente de verdad es el protocolo. Si detectas una discrepancia con él, avisa en vez de corregir.
- Señala cualquier duda de dosis de forma explícita.

## Repositorio público

- Nunca incluyas datos de pacientes (usa solo valores ficticios), datos personales del autor (email, teléfono, colegiado, horarios), credenciales ni documentos internos del hospital, ni en el código, ni en commits ni en PR.
- No añadas referencias al hospital.
- Si dudas de si algo puede publicarse, pregunta antes.

## Cómo probar antes de dar un cambio por terminado

1. Tabla de 70 kg con las diluciones por defecto; debe dar: NA 0,1 µg/kg/min → 4,2 ml/h; VP 0,03 UI/min → 2,25 ml/h; ADR 0,1 µg/kg/min → 10,5 ml/h; AT-II 20 ng/kg/min → 8,4 ml/h; AM 1 mg/kg/h → 70 ml/h; DOB 5 µg/kg/min → 4,2 ml/h.
2. Avisos: NA/ADR ámbar > 0,5 y rojo > 1 µg/kg/min; peso > 150 kg aviso rojo, > 200 kg bloquea.
3. Vista móvil a 390 px sin desplazamiento horizontal, en modo claro y oscuro.

## Diseño

Sistema Modernist: una columna, rejilla con filetes de 2 px, esquinas rectas, tipografía Archivo, verde `#00863e` como acento y colores definidos como variables en `:root` con modo oscuro. Flujo moderno, minimalista e intuitivo.

## Flujo de trabajo

Cambios en una rama y PR; el autor revisa antes de fusionar.
