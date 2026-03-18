# Resumen de Proyecto: Herramienta de Intercambio de Datos (SincroData PRO)

Este documento resume las tareas realizadas, las tecnologías empleadas y la arquitectura del sistema implementado para la gestión de ficheros de intercambio de datos empresariales.

## 1. Objetivo Principal
Crear una herramienta avanzada para la **importación y exportación de datos** en formatos portátiles (**CSV, XML y JSON**), asegurando la integridad de la información mediante validaciones, gestión de errores y generación de informes detallados.

## 2. Pila Tecnológica (Tech Stack)
*   **Lenguaje**: TypeScript (TSX) para un tipado estático seguro.
*   **Entorno**: Node.js 22+ para el backend.
*   **Base de Datos y ORM**: PostgreSQL gestionado con Prisma 7.4.x.
*   **Motor de API**: Express.js para el servidor web.
*   **Intercambio de Datos**:
    *   `csv-parse` / `csv-stringify` para archivos CSV.
    *   `js2xmlparser` / `xml2js` para el manejo de XML.
    *   `fs-extra` para la gestión avanzada del sistema de archivos.
*   **Validación**: Zod (Esquemas deterministas antes de la persistencia).
*   **Frontend**: HTML5, Vanilla CSS (Modern glassmorphism) e i-fa icons.

## 3. Implementación de Lógica (Services)
Se ha desarrollado el servicio `DataExchangeService.ts` con capacidad para:
*   **Importación Multiformato**: Detecta la extensión del archivo y procesa la data cruda, convirtiéndola a objetos JavaScript compatibles con Prisma.
*   **Validación Estricta**: Cada registro es verificado contra un esquema Zod. Solo los datos que cumplen con las reglas de negocio (ej. emails válidos, passwords de longitud >= 6) se envían a la base de datos.
*   **Inserción Masiva (Bulk Insert)**: Se ha optimizado el rendimiento mediante `createMany` con `skipDuplicates` para evitar fallos por registros duplicados.
*   **Exportación Segmentada**: Permite extraer datos de usuarios o productos filtrando por los campos necesarios para cada formato.

## 4. Servidor Web y Dashboard
Se ha implementado una interfaz visual (*Dashboard*) para una mejor experiencia de usuario en la entrega:
*   **Rutas API**:
    *   `POST /api/import/:model`: Procesa subida de archivos mediante Multer.
    *   `GET /api/export/:model/:format`: Genera y descarga el archivo exportado al instante.
    *   `GET /api/reports`: Lista los informes de operaciones anteriores.
*   **Diseño (UI)**:
    *   Arquitectura de tarjetas con efectos de desenfregue (*blur*).
    *   Funcionalidad de **Drag & Drop** para que el usuario no tenga que buscar en el disco.
    *   Modales dinámicos para mostrar el resultado rápido (Éxitos vs Fallos).

## 5. Gestión de Errores e Informes
*   Cada proceso de importación/exportación genera automáticamente un **Informe Detallado** en la carpeta `/reports`.
*   El informe incluye: Fecha del proceso, tipo de operación, total de registros procesados, conteo de éxitos/fallos y la descripción exacta de por qué falló cada registro inválido (referencia de fila e índice).

## 6. Archivos de Prueba Generados
Se han entregado muestras en la carpeta `data_temp/samples` para la grabación del vídeo:
*   `usuarios.json`: Inserción limpia de datos.
*   `productos.csv`: Muestra de campos multi-idioma (es, en, fr, de).
*   `demo_con_errores.xml`: Caso específico para demostrar cómo el sistema reporta y ignora datos mal formados sin detenerse.

## 7. Justificación de la Interfaz Web (Dashboard)
Se ha optado por implementar una **interfaz web moderna (Single Page Application)** en lugar de un simple script de consola por tres motivos fundamentales:
*   **Facilidad de Demostración (Vídeo)**: Permite mostrar visualmente el proceso de carga de archivos y la descarga inmediata de exportables, algo mucho más impactante para la evaluación.
*   **Abstracción Técnica**: El usuario final no necesita conocer comandos de consola; solo debe arrastrar el archivo (`Drag & Drop`) y pulsar un botón.
*   **Monitorización en Tiempo Real**: La web permite listar los informes generados dinámicamente, facilitando el acceso a los reportes de error tras procesar datos inválidos.

## 8. Funcionamiento del Frontend (JavaScript)
El archivo `public/main.js` es el cerebro de la interfaz de usuario:
*   **API del Navegador (File Drag & Drop)**: Captura eventos de arrastre (`dragover`, `drop`) para gestionar la subida de archivos sin necesidad de un botón de "Examinar" anticuado.
*   **Fetch API (Async/Await)**: Realiza llamadas asíncronas al servidor Express. Esto envía los datos mediante un objeto `FormData` (para archivos) y espera la respuesta en JSON para mostrar el resultado sin recargar la página.
*   **Manipulación DOM Dinámica**: Tras cada operación exitosa, se actualiza el listado de reportes y se muestra un **Modal de Resultados** (éxitos/fallos) para dar *feedback* inmediato al usuario.
*   **Descargas Dinámicas**: Gestiona las rutas de exportación activando la descarga nativa del navegador mediante cambios en `window.location`.

## 9. Estructura de Archivos y Responsabilidades
*   `/prisma`: Contiene el esquema de la base de datos PostgreSQL, definiendo los modelos **User** y **Product**.
*   `/src/server.ts`: Configuración principal de Express, define los "endpoints" que conectan la web con el sistema.
*   `/src/services/dataExchange.service.ts`: El corazón lógico del proyecto, encargado de convertir archivos externos a registros de base de datos.
*   `/src/schemas/validation.ts`: Definición de reglas de integridad con **Zod** (esquemas que validan emails, tipos de roles y campos requeridos).
*   `/public`: Archivos estáticos de la interfaz (**HTML/CSS/JS**). Separar estos archivos sigue el principio de "Separación de Intereses" (Separation of Concerns).
*   `/reports`: Almacena los informes generados por cada acción de intercambio para su auditoría posterior.
*   `/data_temp`: Espacio temporal para procesar archivos de subida antes de ser leídos y validados.

## 10. Flujo General de la Aplicación
1.  El usuario selecciona un formato y entidad en el **Dashboard**.
2.  El **Frontend (JS)** envía el archivo al **Servidor (Express)** mediante un POST.
3.  El servidor invoca al **Service (TS)**, que lee el archivo y lo valida campo a campo contra los **Schemas (Zod)**.
4.  Los datos válidos se guardan en la **DB (Prisma/PostgreSQL)**.
5.  Se genera un **Informe** en la carpeta `/reports`.
6.  El servidor responde con un resumen (JSON) al Dashboard.
7.  El usuario visualiza el éxito o los errores detectados en la interfaz.
