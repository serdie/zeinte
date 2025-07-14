
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Política de Cookies - AdivinaExamen',
  description: 'Información sobre el uso de cookies en AdivinaExamen.',
};

export default function CookiesPolicyPage() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl text-primary">
          POLÍTICA DE COOKIES
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Última actualización: 3 de junio de 2025
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-foreground/90 prose prose-sm sm:prose-base max-w-none">
        <p>Esta Política de Cookies describe qué son las cookies, cómo AdivinaExamen las utiliza, y tus opciones respecto a su uso.</p>

        <section aria-labelledby="que-son-cookies">
          <h2 id="que-son-cookies" className="text-xl font-semibold text-foreground mt-4 mb-2">¿Qué son las cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que se almacenan en tu ordenador o dispositivo móvil cuando visitas un sitio web. Las cookies se utilizan ampliamente para hacer que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio.</p>
        </section>

        <section aria-labelledby="como-usamos-cookies">
          <h2 id="como-usamos-cookies" className="text-xl font-semibold text-foreground mt-6 mb-2">¿Cómo utilizamos las cookies?</h2>
          <p>Utilizamos cookies por varias razones:</p>
          <ul className="list-disc list-inside ml-4 my-2 space-y-1">
            <li><strong>Cookies Estrictamente Necesarias:</strong> Son esenciales para que puedas navegar por la aplicación y utilizar sus funciones, como acceder a áreas seguras. Sin estas cookies, algunos servicios que solicitas no pueden ser proporcionados.</li>
            <li><strong>Cookies de Rendimiento/Analíticas:</strong> Recopilan información sobre cómo los visitantes utilizan la aplicación (por ejemplo, qué páginas visitan con más frecuencia, si reciben mensajes de error de las páginas web). Estas cookies no recopilan información que identifique al visitante. Toda la información que recogen es agregada y, por lo tanto, anónima. Se utilizan únicamente para mejorar el funcionamiento de la aplicación.
              <ul className="list-circle list-inside ml-6 mt-1"><li><em>Ejemplo:</em> Podríamos usar cookies de Google Analytics para entender el tráfico de nuestro sitio.</li></ul>
            </li>
            <li><strong>Cookies de Funcionalidad:</strong> Permiten a la aplicación recordar las elecciones que haces (como tu nombre de usuario, idioma o la región en la que te encuentras) y proporcionar características mejoradas y más personalizadas. La información que recogen estas cookies puede ser anonimizada y no pueden rastrear tu actividad de navegación en otros sitios web.</li>
            <li><strong>Cookies de Publicidad/Segmentación:</strong> Se utilizan para mostrar anuncios más relevantes para ti y tus intereses. También se utilizan para limitar el número de veces que ves un anuncio y para ayudar a medir la efectividad de las campañas publicitarias. Suelen ser colocadas por redes publicitarias con el permiso del operador del sitio web.</li>
          </ul>
        </section>

        <section aria-labelledby="cookies-terceros">
          <h2 id="cookies-terceros" className="text-xl font-semibold text-foreground mt-6 mb-2">Cookies de Terceros</h2>
          <p>Es posible que utilicemos servicios de terceros que también coloquen cookies en tu dispositivo cuando visitas nuestra aplicación. Esto puede incluir, por ejemplo, servicios de análisis (como Google Analytics) o redes publicitarias (como Google AdSense). Estas cookies de terceros se rigen por las políticas de cookies de esos terceros.</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li><strong>Google AdSense:</strong> Como utilizamos Google AdSense para mostrar anuncios, AdSense puede usar cookies para mostrar anuncios relevantes en función de tus visitas anteriores a esta aplicación y a otros sitios de Internet. Puedes consultar la política de privacidad de Google para más información sobre cómo Google utiliza los datos para la publicidad.</li>
          </ul>
        </section>

        <section aria-labelledby="control-cookies">
          <h2 id="control-cookies" className="text-xl font-semibold text-foreground mt-6 mb-2">Control de las cookies</h2>
          <p>La mayoría de los navegadores web permiten cierto control de la mayoría de las cookies a través de la configuración del navegador. Sin embargo, si restringes el uso de cookies, es posible que no puedas utilizar todas las funciones de nuestra aplicación.</p>
          <p>Puedes:</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li>Aceptar o rechazar las cookies a través de la configuración de tu navegador.</li>
            <li>Eliminar las cookies que ya se hayan almacenado en tu dispositivo.</li>
          </ul>
          <p>Para obtener más información sobre cómo gestionar las cookies en tu navegador, puedes visitar los enlaces de ayuda de los navegadores más comunes:</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li><a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-que-los-sitios-web" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63944406-7839-42d9-8091-bbbbb13ea71e" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Apple Safari</a></li>
          </ul>
        </section>

        <section aria-labelledby="cambios-politica-cookies">
          <h2 id="cambios-politica-cookies" className="text-xl font-semibold text-foreground mt-6 mb-2">Cambios en esta Política de Cookies</h2>
          <p>Podemos actualizar nuestra Política de Cookies de vez en cuando. Te notificaremos cualquier cambio publicando la nueva Política de Cookies en esta página. Te recomendamos revisar esta Política de Cookies periódicamente para cualquier cambio.</p>
        </section>

        <section aria-labelledby="contacto-cookies">
          <h2 id="contacto-cookies" className="text-xl font-semibold text-foreground mt-6 mb-2">Contacto</h2>
          <p>Si tienes alguna pregunta sobre esta Política de Cookies, puedes contactarnos a través de info@zeinte.com.</p>
        </section>
      </CardContent>
    </Card>
  );
}
