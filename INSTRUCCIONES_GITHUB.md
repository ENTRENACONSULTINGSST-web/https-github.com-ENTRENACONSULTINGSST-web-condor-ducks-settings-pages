# Guía de Resolución de Errores y Despliegue en GitHub Pages - Condor Ducks

He preparado esta guía detallada para resolver los problemas que tuviste (el terminal local, la página en blanco en GitHub Pages y los errores de Git). **Guarda este archivo en tu computadora o descárgalo con el proyecto para no perderlo.**

---

## 1. ¿Por qué la página se veía en blanco (`page white`)?
**Solución ya aplicada:** 
El problema de la página en blanco ocurre porque Vite, por defecto, genera rutas absolutas (como `/assets/...`) buscando los archivos en la raíz del servidor de GitHub.
*   **Qué hice para solucionarlo:** Modifiqué el archivo `vite.config.ts` y agregué la línea `base: './'`. Esto fuerza a que las rutas sean relativas, permitiendo que GitHub Pages encuentre las imágenes, sonidos y estilos sin importar en qué subcarpeta estén.

---

## 2. Solución a tus errores del terminal local

### A. Error: `fatal: unable to auto-detect email address`
Este error ocurre porque Git en tu computadora no sabe quién eres (no tiene tu correo ni tu nombre configurados).
*   **Cómo solucionarlo:** Abre tu terminal (PowerShell) en la carpeta de tu proyecto y ejecuta estas dos líneas con tus datos de GitHub:
    ```bash
    git config --global user.email "tu-correo@gmail.com"
    git config --global user.name "TuNombreDeUsuario"
    ```

### B. Error: `npm : El término 'npm' no se reconoce...`
Este error significa que **no tienes Node.js instalado en tu computadora**, o no está configurado en las variables de entorno.
*   **Cómo solucionarlo:**
    1. Ve a la página oficial: [https://nodejs.org/](https://nodejs.org/)
    2. Descarga e instala la versión **LTS** (Recomendada para la mayoría).
    3. Una vez instalado, **cierra por completo tu terminal/PowerShell y vuelve a abrirlo** para que reconozca el comando `npm`.

---

## 3. ¿Cómo subir el código si el botón de Google AI Studio falla?

Si la interfaz visual de AI Studio te da el error *"Failed to push commit to GitHub"*, hazlo manualmente de la forma más segura y rápida usando un archivo **ZIP**:

1. En Google AI Studio, abre el menú de configuración (icono de engranaje ⚙️) en la parte superior derecha o menú del applet.
2. Selecciona **Exportar como ZIP** (Export as ZIP).
3. Descomprime ese archivo ZIP dentro de tu carpeta local:
   `C:\Users\chmed\Desktop\Mis proyectos\GITHUB repositorios\ballon condor`
4. Abre la Terminal (PowerShell) en esa carpeta y ejecuta este bloque completo para subir los cambios reales:
   ```powershell
   git add .
   git commit -m "Actualizar código de Condor Ducks optimizado"
   git push origin main
   ```

---

## 4. Cómo configurar GitHub Pages correctamente (¡Sin Page White!)

Tienes dos formas de publicar tu juego en GitHub Pages. Ambas funcionan perfectamente ahora que corregimos la ruta base (`base: './'`).

### Opción A (La más recomendada y automática: GitHub Actions)
He creado el archivo de flujos automatizados `.github/workflows/deploy.yml` para ti en este proyecto. Para usarlo:
1. En GitHub, ve a la pestaña de **Settings** (Configuración) de tu repositorio `condor-ducks`.
2. En el menú de la izquierda, haz clic en **Pages**.
3. Bajo **Build and deployment** -> **Source**, cámbialo a **GitHub Actions**.
4. ¡Listo! Cada vez que hagas un `git push origin main`, GitHub compilará tu juego de forma 100% automática y lo publicará en pocos segundos.

### Opción B (Usando tu rama `gh-pages` seleccionada de forma clásica)
Si prefieres el método clásico de seleccionar una rama:
1. Asegúrate de hacer el paso [Opción A] primero o ejecutar `npm run build` localmente y empujar la carpeta `dist`.
2. El flujo que te instalé creará automáticamente una rama llamada `gh-pages` en tu repositorio de GitHub en cuanto detecte el primer push a `main`.
3. Una vez creada esa rama, en la sección **Pages** de tu GitHub, podrás elegir **Deploy from a branch** y ahora sí te aparecerá la opción de seleccionar la rama `gh-pages` en lugar de `main`. Haz clic en **Save**.
