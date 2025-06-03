
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Aviso Legal y Condiciones de Uso - Zeinte',
  description: 'Consulta el aviso legal y las condiciones generales de uso del sitio web zeinte.com y la aplicación AdivinaExamen.',
};

export default function LegalTermsPage() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl text-primary">
          AVISO LEGAL Y CONDICIONES GENERALES DE USO DEL SITIO WEB Y APLICACIÓN ADIVINAEXAMEN
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Última actualización: 3 de junio de 2025
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-foreground/90 prose prose-sm sm:prose-base max-w-none">
        <section aria-labelledby="datos-identificativos">
          <h2 id="datos-identificativos" className="text-xl font-semibold text-foreground mt-4 mb-2">1. DATOS IDENTIFICATIVOS DEL TITULAR DEL SITIO WEB Y LA APLICACIÓN</h2>
          <p>En cumplimiento del deber de información establecido en la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), a continuación se facilitan los datos generales del titular del sitio web zeinte.com y de la aplicación "AdivinaExamen":</p>
          <ul className="list-disc list-inside ml-4 my-2">
            <li><strong>Denominación Social:</strong> SEARCH AND MAKE S.L.</li>
            <li><strong>NIF:</strong> B45786787</li>
            <li><strong>Domicilio Social:</strong> Calle Conquistadores 8, 45500 Torrijos, Toledo, España</li>
            <li><strong>Correo electrónico de contacto:</strong> info@zeinte.com</li>
          </ul>
        </section>

        <section aria-labelledby="objeto-ambito">
          <h2 id="objeto-ambito" className="text-xl font-semibold text-foreground mt-6 mb-2">2. OBJETO Y ÁMBITO DE APLICACIÓN</h2>
          <p>El presente Aviso Legal y las Condiciones Generales de Uso (en adelante, "Condiciones") regulan el acceso y la utilización del sitio web zeinte.com y de la aplicación "AdivinaExamen" (en adelante, "la Plataforma"), propiedad de SEARCH AND MAKE S.L.</p>
          <p>La utilización de la Plataforma atribuye la condición de usuario e implica la plena y expresa aceptación de todas y cada una de las disposiciones incluidas en estas Condiciones, en la versión publicada por SEARCH AND MAKE S.L. en el momento mismo en que el usuario acceda a la Plataforma.</p>
          <p>SEARCH AND MAKE S.L. se reserva el derecho a modificar, en cualquier momento y sin necesidad de previo aviso, la presentación y configuración de la Plataforma, así como las presentes Condiciones. Por ello, se recomienda al usuario leer atentamente estas Condiciones cada vez que acceda a la Plataforma.</p>
        </section>

        <section aria-labelledby="propiedad-intelectual">
          <h2 id="propiedad-intelectual" className="text-xl font-semibold text-foreground mt-6 mb-2">3. PROPIEDAD INTELECTUAL E INDUSTRIAL</h2>
          <p>Todos los derechos de propiedad intelectual e industrial del contenido de la Plataforma (textos, imágenes, diseños gráficos, código fuente, logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su funcionamiento, acceso y uso, etc.), así como de la aplicación "AdivinaExamen", son titularidad exclusiva de SEARCH AND MAKE S.L. o bien de terceros que han autorizado su uso a SEARCH AND MAKE S.L.</p>
          <p>Quedan expresamente prohibidas la reproducción, la distribución y la comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o parte de los contenidos de la Plataforma, con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización expresa y por escrito de SEARCH AND MAKE S.L.</p>
          <p>El usuario se compromete a respetar los derechos de Propiedad Intelectual e Industrial titularidad de SEARCH AND MAKE S.L. Podrá visualizar los elementos de la Plataforma e incluso imprimirlos, copiarlos y almacenarlos en el disco duro de su ordenador o en cualquier otro soporte físico siempre y cuando sea, única y exclusivamente, para su uso personal y privado.</p>
        </section>

        <section aria-labelledby="exclusion-garantias">
          <h2 id="exclusion-garantias" className="text-xl font-semibold text-foreground mt-6 mb-2">4. EXCLUSIÓN DE GARANTÍAS Y RESPONSABILIDAD</h2>
          <p>SEARCH AND MAKE S.L. no garantiza la disponibilidad y continuidad del funcionamiento de la Plataforma y de sus servicios. Cuando ello sea razonablemente posible, se advertirá previamente de las interrupciones en el funcionamiento de la Plataforma.</p>
          <p>SEARCH AND MAKE S.L. no asume responsabilidad alguna por los daños y perjuicios de toda naturaleza que pudieran derivarse de la falta de disponibilidad o de continuidad del funcionamiento de la Plataforma, de la defraudación de la utilidad que los usuarios hubieren podido atribuir a la Plataforma, a la fiabilidad de la Plataforma, y en particular, aunque no de modo exclusivo, a los fallos en el acceso a las distintas páginas web o a aquellas desde las que se prestan los servicios.</p>
          <p>SEARCH AND MAKE S.L. no asume responsabilidad alguna por los daños y perjuicios de toda naturaleza que pudieran derivarse del conocimiento que puedan tener terceros no autorizados de las condiciones, características y circunstancias del uso que los usuarios hacen de la Plataforma.</p>
          <p>SEARCH AND MAKE S.L. no asume responsabilidad alguna por los daños y perjuicios de toda naturaleza que pudieran derivarse de la presencia de virus o de la presencia de otros elementos lesivos en los contenidos que puedan producir alteración en los sistemas informáticos de los usuarios o en los documentos electrónicos y ficheros almacenados en sus sistemas.</p>
        </section>

        <section aria-labelledby="modificaciones-app">
          <h2 id="modificaciones-app" className="text-xl font-semibold text-foreground mt-6 mb-2">5. MODIFICACIONES DE LA APLICACIÓN Y DEL SITIO WEB</h2>
          <p>SEARCH AND MAKE S.L. se reserva el derecho a cambiar, modificar, suspender o discontinuar, temporal o permanentemente, la aplicación "AdivinaExamen" y el sitio web zeinte.com o cualquier parte de los mismos, con o sin previo aviso y sin que ello genere derecho a indemnización alguna en favor del usuario. Esta facultad incluye, pero no se limita a, la adición o eliminación de funcionalidades, la alteración del contenido, la interrupción del servicio para mantenimiento o actualización, o la terminación del servicio por completo.</p>
        </section>

        <section aria-labelledby="enlaces">
          <h2 id="enlaces" className="text-xl font-semibold text-foreground mt-6 mb-2">6. ENLACES</h2>
          <p>La Plataforma puede incluir enlaces a otros sitios web gestionados por terceros, con el objetivo de facilitar el acceso del usuario a información, servicios y contenidos disponibles en Internet. SEARCH AND MAKE S.L. no ejerce ningún control sobre dichos sitios web ni es responsable de sus contenidos. La inclusión de estos enlaces no implica la existencia de relación alguna entre SEARCH AND MAKE S.L. y el titular del sitio web enlazado, ni la aprobación o aceptación de sus contenidos o servicios.</p>
        </section>

        <section aria-labelledby="politica-privacidad">
          <h2 id="politica-privacidad" className="text-xl font-semibold text-foreground mt-6 mb-2">7. POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS</h2>
          <p>En cumplimiento de lo dispuesto en la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD) y el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016, relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos (RGPD), SEARCH AND MAKE S.L. informa a los usuarios que ha adoptado e implementado las medidas de seguridad técnicas y organizativas conforme a lo dispuesto en la normativa vigente.</p>
          <p>Para obtener información detallada sobre el tratamiento de sus datos personales, por favor, consulte nuestra Política de Privacidad, que forma parte integrante de estas Condiciones y está disponible en un enlace específico dentro de la Plataforma.</p>
        </section>

        <section aria-labelledby="ley-aplicable">
          <h2 id="ley-aplicable" className="text-xl font-semibold text-foreground mt-6 mb-2">8. LEY APLICABLE Y JURISDICCIÓN</h2>
          <p>Las presentes Condiciones se rigen por la ley española.</p>
          <p>Para la resolución de todas las controversias o cuestiones relacionadas con la Plataforma o las presentes Condiciones, serán competentes los Juzgados y Tribunales de Toledo, renunciando expresamente el usuario a cualquier otro fuero que pudiera corresponderle.</p>
        </section>
      </CardContent>
    </Card>
  );
}
