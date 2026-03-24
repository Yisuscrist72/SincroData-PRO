# SincroData PRO 🚀

Herramienta avanzada de gestión e intercambio de datos empresariales que permite importar y exportar información en múltiples formatos (**CSV, XML y JSON**) con validación de datos en tiempo real.

## 📋 Características principales

*   **Importación Multiformato**: Carga de datos masiva desde archivos `.csv`, `.json` y `.xml`.
*   **Exportación Flexible**: Generación de archivos portátiles de las entidades de la base de datos.
*   **Validación de Datos**: Integración con **Zod** para asegurar que cada registro cumple con las reglas de negocio antes de ser persistido.
*   **Gestión de Errores**: Sistema de reportes automáticos que detalla fallos específicos de validación (índices, campos y razones).
*   **Dashboard Moderno**: Interfaz web fluida con soporte para **Drag & Drop** y notificaciones dinámicas.

## 🛠️ Requisitos previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

1.  [Node.js](https://nodejs.org/) (versión 20+)
2.  [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## ⚙️ Configuración Inicial

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la raíz del proyecto (si no existe) con el siguiente contenido:
    ```env
    DATABASE_URL="postgresql://admin:admin123@localhost:5444/empresa_db?schema=public"
    ```
    *Nota: Utilizamos el puerto **5444** para evitar conflictos comunes con puertos reservados en Windows (como el 5432).*

3.  **Levantar la Base de Datos**:
    ```bash
    docker-compose up -d
    ```

4.  **Preparar la Base de Datos**:
    Sincroniza el esquema y genera el cliente de Prisma:
    ```bash
    npx prisma db push
    npm run seed
    ```

## 🚀 Cómo empezar

### 1. Iniciar el Dashboard
Para lanzar la herramienta visual y habilitar la API, ejecuta:
```bash
npm run dashboard
```
Abre tu navegador en: 👉 **[http://localhost:3000](http://localhost:3000)**

### 2. Explorar Datos (Prisma Studio)
Si deseas ver o editar los datos de la base de datos de forma visual:
```bash
npx prisma studio
```
Se abrirá en: 👉 **[http://localhost:5555](http://localhost:5555)** (o el puerto que indique la consola).

## 📂 Estructura del Proyecto

*   `src/services/dataExchange.service.ts`: Lógica centralizada de conversión y validación.
*   `src/server.ts`: Servidor Express y API REST.
*   `public/`: Interfaz de usuario (HTML, CSS y JavaScript moderno).
*   `reports/`: Almacén de informes generados tras cada operación de intercambio.
*   `data_temp/samples/`: Ejemplos prácticos listos para probar la herramienta.

## 🛡️ Seguridad y Tecnología

Este proyecto utiliza **Prisma ORM** para una comunicación segura y tipada con la base de datos, eliminando el riesgo de inyección SQL y optimizando las consultas mediante inserciones masivas (`createMany`).

## 💡 Solución de problemas comunes

### Error P1000 (Authentication Failed)
Si recibes un error de autenticación al ejecutar `npx prisma db push`, intenta lo siguiente:
1.  Asegúrate de que no haya otro servicio usando el puerto (hemos movido el puerto a **5444** para evitar esto).
2.  Si cambiaste la contraseña después de haber levantado el contenedor por primera vez, Docker no la actualizará automáticamente. Ejecuta:
    ```bash
    docker-compose down -v
    docker-compose up -d
    ```
    *Advertencia: Esto borrará los datos actuales de la base de datos (pero los recuperarás al ejecutar el seed).*

---
Desarrollado para el módulo de Acceso a Datos como herramienta de gestión de ficheros persistentes.
