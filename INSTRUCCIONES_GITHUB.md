# Cómo Subir tu Proyecto a un Repositorio de GitHub

Esta guía te mostrará cómo subir el código de este proyecto a tu propio repositorio en GitHub.

### Prerrequisitos

1.  **Tener Git instalado:** Si no lo tienes, descárgalo desde [git-scm.com](https://git-scm.com/).
2.  **Tener una cuenta de GitHub:** Si no tienes una, créala en [github.com](https://github.com).

---

### Paso 1: Crea un Nuevo Repositorio en GitHub

1.  Ve a [GitHub](https://github.com) e inicia sesión.
2.  Haz clic en el icono **+** en la esquina superior derecha y selecciona **"New repository"**.
3.  Dale un nombre a tu repositorio (por ejemplo, `mi-app-zeinte`).
4.  Puedes añadir una descripción si quieres.
5.  **IMPORTANTE:** Asegúrate de que el repositorio sea **público** o **privado** según tu preferencia. **NO** inicialices el repositorio con un archivo `README`, `.gitignore` o `license`. Debe estar completamente vacío.
6.  Haz clic en el botón **"Create repository"**.

---

### Paso 2: Conecta tu Proyecto Local con GitHub

Después de crear el repositorio, GitHub te mostrará una página con varios comandos. Nos interesan los que están bajo la sección **"...or push an existing repository from the command line"**.

Abre una terminal o línea de comandos en la carpeta raíz de este proyecto (la misma donde está el archivo `package.json`) y ejecuta los siguientes tres comandos.

1.  **Añade el repositorio remoto:**
    *   Copia y pega este comando en tu terminal. **Asegúrate de reemplazar `TU_USUARIO` y `TU_REPOSITORIO`** con tu nombre de usuario y el nombre de tu repositorio en GitHub.

    ```bash
    git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
    ```

2.  **(Opcional) Renombra la rama principal a `main`:**
    *   Es una buena práctica usar `main` como el nombre de la rama principal.

    ```bash
    git branch -M main
    ```

3.  **Sube (push) tu código al repositorio:**
    *   Este comando subirá todos los archivos de tu proyecto a GitHub.

    ```bash
    git push -u origin main
    ```

---

### ¡Listo!

¡Eso es todo! Si refrescas la página de tu repositorio en GitHub, verás todos los archivos de tu proyecto. A partir de ahora, cada vez que hagas cambios, podrás guardarlos en git (`git commit`) и subirlos a GitHub (`git push`).
