
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Política de Privacidad - Zeinte',
  description: 'Información sobre cómo Zeinte recopila, utiliza y protege tus datos personales.',
};

export default function PrivacyPolicyPage() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl text-primary">
          POLÍTICA DE PRIVACIDAD
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Última actualización: 3 de junio de 2025
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-foreground/90 prose prose-sm sm:prose-base max-w-none">
        <p>En Zeinte, nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, utilizamos y divulgamos tu información personal cuando utilizas nuestra aplicación Zeinte. Al utilizar la aplicación, aceptas la recopilación y el uso de la información de acuerdo con esta política.</p>

        <section aria-labelledby="datos-recopilamos">
          <h2 id="datos-recopilamos" className="text-xl font-semibold text-foreground mt-4 mb-2">1. Datos que Recopilamos</h2>
          <p>Podemos recopilar y procesar los siguientes tipos de datos sobre ti:</p>
          <ul className="list-disc list-inside ml-4 my-2 space-y-1">
            <li><strong>Datos proporcionados por ti:</strong>
              <ul className="list-circle list-inside ml-6 mt-1">
                <li>Información de registro (ej. nombre de usuario, dirección de correo electrónico) si la aplicación requiere registro.</li>
                <li>Datos de contacto (ej. nombre, correo electrónico) si te comunicas con nosotros a través de formularios o correos electrónicos.</li>
                <li>Contenido que generas o subes (ej. respuestas a preguntas, puntuaciones) dentro de la aplicación.</li>
              </ul>
            </li>
            <li><strong>Datos recopilados automáticamente:</strong>
              <ul className="list-circle list-inside ml-6 mt-1">
                <li><strong>Información de uso:</strong> Información sobre cómo accedes y utilizas la aplicación, como tu dirección IP, tipo de navegador, sistema operativo, páginas visitadas, tiempo dedicado en la aplicación, rutas de navegación y otros datos de diagnóstico.</li>
                <li><strong>Datos de dispositivo:</strong> Información sobre el dispositivo que utilizas para acceder a la aplicación, incluyendo el tipo de dispositivo, identificadores únicos del dispositivo y datos de red móvil.</li>
                <li><strong>Cookies y Tecnologías Similares:</strong> Utilizamos cookies y tecnologías de seguimiento similares para rastrear la actividad en nuestra aplicación y mantener cierta información. Consulta nuestra Política de Cookies para más detalles.</li>
                <li><strong>Datos de Google AdSense:</strong> Como usamos Google AdSense, se pueden recopilar datos para personalizar anuncios. Consulta la política de privacidad de Google para más detalles sobre cómo utilizan los datos.</li>
              </ul>
            </li>
          </ul>
        </section>

        <section aria-labelledby="como-usamos-datos">
          <h2 id="como-usamos-datos" className="text-xl font-semibold text-foreground mt-6 mb-2">2. Cómo Utilizamos tus Datos</h2>
          <p>Utilizamos la información recopilada para diversas finalidades:</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li>Para proporcionar, operar y mantener nuestra aplicación.</li>
            <li>Para mejorar, personalizar y expandir nuestra aplicación.</li>
            <li>Para comprender y analizar cómo utilizas nuestra aplicación.</li>
            <li>Para desarrollar nuevos productos, servicios, características y funcionalidades.</li>
            <li>Para comunicarnos contigo, ya sea directamente o a través de uno de nuestros socios, incluyendo para servicio al cliente, para proporcionarte actualizaciones y otra información relacionada con la aplicación, y para fines de marketing y promoción.</li>
            <li>Para procesar tus transacciones (si aplica).</li>
            <li>Para enviarte correos electrónicos.</li>
            <li>Para encontrar y prevenir el fraude.</li>
            <li>Para mostrar anuncios relevantes a través de Google AdSense y otros socios publicitarios.</li>
          </ul>
        </section>

        <section aria-labelledby="base-legal">
          <h2 id="base-legal" className="text-xl font-semibold text-foreground mt-6 mb-2">3. Base Legal para el Tratamiento de tus Datos</h2>
          <p>Nuestro tratamiento de tus datos personales se basa en las siguientes bases legales según el Reglamento General de Protección de Datos (RGPD):</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li><strong>Consentimiento:</strong> Cuando nos has dado tu consentimiento para procesar tus datos para uno o más fines específicos.</li>
            <li><strong>Ejecución de un contrato:</strong> Cuando el procesamiento es necesario para la ejecución de un contrato en el que eres parte o para tomar medidas a petición tuya antes de celebrar dicho contrato.</li>
            <li><strong>Obligación legal:</strong> Cuando el procesamiento es necesario para el cumplimiento de una obligación legal a la que estamos sujetos.</li>
            <li><strong>Intereses vitales:</strong> Cuando el procesamiento es necesario para proteger tus intereses vitales o los de otra persona física.</li>
            <li><strong>Intereses legítimos:</strong> Cuando el procesamiento es necesario para los fines de los intereses legítimos perseguidos por nosotros o por un tercero, siempre que sobre dichos intereses no prevalezcan tus intereses o tus derechos y libertades fundamentales.</li>
          </ul>
        </section>

        <section aria-labelledby="divulgacion-datos">
          <h2 id="divulgacion-datos" className="text-xl font-semibold text-foreground mt-6 mb-2">4. Divulgación de tus Datos</h2>
          <p>Podemos compartir tu información personal en las siguientes situaciones:</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li><strong>Con proveedores de servicios:</strong> Podemos compartir tu información personal con proveedores de servicios de terceros para monitorear y analizar el uso de nuestra aplicación, para contactarte.</li>
            <li><strong>Para transferencias de negocios:</strong> Podemos compartir o transferir tu información personal en relación con, o durante las negociaciones de, cualquier fusión, venta de activos de la empresa, financiación o adquisición de todo o una parte de nuestro negocio a otra empresa.</li>
            <li><strong>Con Afiliados:</strong> Podemos compartir tu información con nuestras filiales, en cuyo caso les exigiremos que respeten esta Política de Privacidad.</li>
            <li><strong>Con socios comerciales:</strong> Podemos compartir tu información con nuestros socios comerciales para ofrecerte ciertos productos, servicios o promociones.</li>
            <li><strong>Con otros usuarios:</strong> Cuando compartes información personal o interactúas de otra manera en las áreas públicas, dicha información puede ser vista por todos los usuarios y puede distribuirse públicamente en el exterior.</li>
            <li><strong>Con tu consentimiento:</strong> Podemos divulgar tu información personal para cualquier otro propósito con tu consentimiento.</li>
          </ul>
        </section>

        <section aria-labelledby="retencion-datos">
          <h2 id="retencion-datos" className="text-xl font-semibold text-foreground mt-6 mb-2">5. Retención de Datos</h2>
          <p>Retendremos tus datos personales solo durante el tiempo necesario para los fines establecidos en esta Política de Privacidad. También retendremos y utilizaremos tus datos personales en la medida necesaria para cumplir con nuestras obligaciones legales (por ejemplo, si estamos obligados a retener tus datos para cumplir con las leyes aplicables), resolver disputas y hacer cumplir nuestros acuerdos y políticas legales.</p>
        </section>

        <section aria-labelledby="seguridad-datos">
          <h2 id="seguridad-datos" className="text-xl font-semibold text-foreground mt-6 mb-2">6. Seguridad de los Datos</h2>
          <p>La seguridad de tus datos es importante para nosotros, pero recuerda que ningún método de transmisión por Internet o método de almacenamiento electrónico es 100% seguro. Aunque nos esforzamos por utilizar medios comercialmente aceptables para proteger tus datos personales, no podemos garantizar su seguridad absoluta.</p>
        </section>

        <section aria-labelledby="derechos-rgpd">
          <h2 id="derechos-rgpd" className="text-xl font-semibold text-foreground mt-6 mb-2">7. Tus Derechos de Protección de Datos (RGPD)</h2>
          <p>Si resides en el Espacio Económico Europeo (EEE), tienes ciertos derechos de protección de datos. En determinadas circunstancias, tienes los siguientes derechos:</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li><strong>Derecho de acceso:</strong> Tienes derecho a solicitar copias de tus datos personales.</li>
            <li><strong>Derecho de rectificación:</strong> Tienes derecho a solicitar que corrijamos cualquier información que creas que es inexacta. También tienes derecho a solicitar que completemos la información que creas que es incompleta.</li>
            <li><strong>Derecho de supresión (derecho al olvido):</strong> Tienes derecho a solicitar que borremos tus datos personales, bajo ciertas condiciones.</li>
            <li><strong>Derecho a la limitación del tratamiento:</strong> Tienes derecho a solicitar que restrinjamos el tratamiento de tus datos personales, bajo ciertas condiciones.</li>
            <li><strong>Derecho a la portabilidad de los datos:</strong> Tienes derecho a solicitar que transfiramos los datos que hemos recopilado a otra organización, o directamente a ti, bajo ciertas condiciones.</li>
            <li><strong>Derecho a oponerte al tratamiento:</strong> Tienes derecho a oponerte a nuestro tratamiento de tus datos personales, bajo ciertas condiciones.</li>
            <li><strong>Derecho a retirar el consentimiento:</strong> Tienes derecho a retirar tu consentimiento en cualquier momento si basamos el tratamiento en el consentimiento.</li>
          </ul>
          <p>Para ejercer cualquiera de estos derechos, por favor contáctanos. Si realizas una solicitud, tenemos un mes para responderte.</p>
        </section>

        <section aria-labelledby="enlaces-otros-sitios">
          <h2 id="enlaces-otros-sitios" className="text-xl font-semibold text-foreground mt-6 mb-2">8. Enlaces a Otros Sitios Web</h2>
          <p>Nuestra aplicación puede contener enlaces a otros sitios web que no son operados por nosotros. Si haces clic en un enlace de terceros, serás dirigido al sitio de ese tercero. Te recomendamos encarecidamente que revises la Política de Privacidad de cada sitio que visites. No tenemos control ni asumimos ninguna responsabilidad por el contenido, las políticas de privacidad o las prácticas de los sitios o servicios de terceros.</p>
        </section>

        <section aria-labelledby="cambios-politica-privacidad">
          <h2 id="cambios-politica-privacidad" className="text-xl font-semibold text-foreground mt-6 mb-2">9. Cambios en esta Política de Privacidad</h2>
          <p>Podemos actualizar nuestra Política de Privacidad de vez en cuando. Te notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página. Te recomendamos revisar esta Política de Privacidad periódicamente para cualquier cambio.</p>
        </section>

        <section aria-labelledby="contacto-privacidad">
          <h2 id="contacto-privacidad" className="text-xl font-semibold text-foreground mt-6 mb-2">10. Contacto</h2>
          <p>Si tienes alguna pregunta sobre esta Política de Privacidad, puedes contactarnos a través de:</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li>Correo electrónico: info@zeinte.com</li>
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}

    