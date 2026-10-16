import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface LegalSection { title: string; paragraphs: string[]; items?: string[]; }
interface LegalDocument { eyebrow: string; title: string; updated: string; intro: string; sections: LegalSection[]; }

const DOCUMENTS: Record<string, LegalDocument> = {
  notice: {
    eyebrow: 'TRANSPARENCIA', title: 'Aviso legal', updated: '16 de octubre de 2026',
    intro: 'Este sitio utiliza StayManager, una solución tecnológica de JGMSolutions para la consulta y administración de reservas de alojamiento.',
    sections: [
      { title: 'Responsables del servicio', paragraphs: ['El alojamiento publicado es responsable de su oferta, disponibilidad, precios, condiciones de estadía y atención al huésped. JGMSolutions actúa como proveedor tecnológico de StayManager.'] },
      { title: 'Uso permitido', paragraphs: ['La información del sitio debe usarse para consultar alojamientos, solicitar reservas, revisar una reserva existente y comunicarse con el establecimiento.'], items: ['No intentar acceder a cuentas o reservas de terceros.', 'No automatizar solicitudes abusivas ni interferir con el servicio.', 'No aportar información falsa o ilícita.'] },
      { title: 'Reservas y pagos', paragraphs: ['Una solicitud no equivale a una reserva confirmada hasta que el alojamiento valide disponibilidad y pago. Los comprobantes se envían por WhatsApp y el saldo solo cambia cuando el administrador aprueba el movimiento.'] },
      { title: 'Propiedad intelectual', paragraphs: ['La marca StayManager, su interfaz y el software pertenecen a JGMSolutions. Las fotografías y marcas de cada alojamiento pertenecen a sus respectivos titulares o se usan conforme a sus licencias.'] },
      { title: 'Contacto', paragraphs: ['Para soporte sobre la plataforma puedes comunicarte con JGMSolutions al WhatsApp +57 323 309 8671. Para asuntos de una reserva debes contactar directamente al alojamiento.'] }
    ]
  },
  privacy: {
    eyebrow: 'PROTECCIÓN DE DATOS', title: 'Política de privacidad', updated: '16 de octubre de 2026',
    intro: 'Explicamos qué datos se tratan, para qué se usan y cómo ejercer tus derechos de acuerdo con la legislación colombiana aplicable.',
    sections: [
      { title: 'Datos que recopilamos', paragraphs: ['Al solicitar o consultar una reserva podemos tratar nombre, documento, correo, teléfono, fechas, acompañantes, solicitudes especiales, referencias de pago y datos técnicos básicos de seguridad.'] },
      { title: 'Finalidades', paragraphs: ['Los datos se usan únicamente para gestionar cotizaciones y reservas, validar pagos, prestar la estadía, atender solicitudes, prevenir abuso, enviar comunicaciones operativas y cumplir obligaciones legales.'] },
      { title: 'Base y autorización', paragraphs: ['El tratamiento se fundamenta en la autorización del titular, la ejecución de medidas precontractuales o contractuales y las obligaciones legales del alojamiento. Los campos necesarios se identifican en cada formulario.'] },
      { title: 'Encargados y transferencias', paragraphs: ['El alojamiento es responsable de los datos de sus huéspedes. JGMSolutions y sus proveedores de infraestructura actúan como encargados cuando operan StayManager. No vendemos datos personales.'] },
      { title: 'Conservación y seguridad', paragraphs: ['La información se conserva durante el tiempo necesario para la reserva y los plazos legales. Aplicamos control de acceso, cifrado en tránsito, registros de auditoría, rate limit y medidas contra envíos duplicados. Ningún sistema elimina totalmente el riesgo.'] },
      { title: 'Derechos del titular', paragraphs: ['Puedes conocer, actualizar, rectificar o solicitar la supresión de tus datos; revocar la autorización cuando proceda; presentar consultas y reclamos; y acudir ante la Superintendencia de Industria y Comercio.'], items: ['Identifica la reserva y el derecho que deseas ejercer.', 'Contacta primero al alojamiento responsable.', 'Para soporte técnico escribe al WhatsApp +57 323 309 8671.'] },
      { title: 'Datos de menores', paragraphs: ['Los datos de niños o adolescentes solo deben ser aportados por su representante y cuando sean necesarios para prestar el servicio, respetando su interés superior.'] }
    ]
  },
  cookies: {
    eyebrow: 'PREFERENCIAS', title: 'Política de cookies', updated: '16 de octubre de 2026',
    intro: 'StayManager utiliza almacenamiento local y tecnologías similares de forma limitada, transparente y controlable.',
    sections: [
      { title: 'Cookies esenciales', paragraphs: ['Son necesarias para recordar la sesión administrativa, conservar preferencias de seguridad, mantener el consentimiento y operar funciones básicas. No pueden desactivarse desde el aviso porque el sitio podría dejar de funcionar correctamente.'] },
      { title: 'Analítica opcional', paragraphs: ['Google Analytics solo se carga si seleccionas “Aceptar analítica” y si el operador configuró un identificador de medición. Se habilita la anonimización de IP y se recopilan métricas agregadas de navegación.'] },
      { title: 'Cómo cambiar tu decisión', paragraphs: ['Puedes borrar el almacenamiento y las cookies de este sitio desde la configuración del navegador. Al volver a entrar, StayManager solicitará nuevamente tu preferencia.'] },
      { title: 'Duración', paragraphs: ['La preferencia de consentimiento permanece en el navegador hasta que la elimines. La duración de cookies de terceros depende del proveedor y de su configuración vigente.'] }
    ]
  }
};

@Component({
  selector: 'app-legal-page', standalone: true, imports: [RouterLink],
  template: `
    <section class="legal-hero"><div class="container legal-width"><span class="eyebrow light">{{document.eyebrow}}</span><h1>{{document.title}}</h1><p>{{document.intro}}</p><small>Última actualización: {{document.updated}}</small></div></section>
    <section class="section"><div class="container legal-width"><nav class="legal-nav" aria-label="Documentos legales"><a routerLink="/aviso-legal">Aviso legal</a><a routerLink="/politica-privacidad">Privacidad</a><a routerLink="/politica-cookies">Cookies</a></nav><article class="legal-card">@for(section of document.sections;track section.title){<section><h2>{{section.title}}</h2>@for(paragraph of section.paragraphs;track paragraph){<p>{{paragraph}}</p>}@if(section.items){<ul>@for(item of section.items;track item){<li>{{item}}</li>}</ul>}</section>}</article><div class="legal-note"><i class="bi bi-info-circle"></i><span>Antes de producción, cada alojamiento debe completar sus datos de identificación, canales de atención y políticas comerciales particulares.</span></div></div></section>
  `,
  styles: [`
    .legal-hero{padding:8.5rem 0 4rem;color:#fff;background:linear-gradient(120deg,rgba(6,38,32,.96),rgba(11,75,64,.78)),url('https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&fm=webp&w=1600&q=68') center/cover}.legal-width{max-width:880px}.legal-hero h1{font:400 clamp(2.7rem,6vw,4.7rem) Georgia,serif;margin:.55rem 0 1rem}.legal-hero p{max-width:720px;color:#dceae6}.legal-hero small{color:#b9d1ca}.legal-nav{display:flex;gap:.6rem;flex-wrap:wrap;margin-bottom:1rem}.legal-nav a{padding:.55rem .8rem;border:1px solid var(--line);border-radius:999px;color:var(--primary);font-size:.68rem;font-weight:800}.legal-card{padding:clamp(1.3rem,4vw,3rem);background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:var(--shadow)}.legal-card section+section{padding-top:1.5rem;margin-top:1.5rem;border-top:1px solid var(--line)}.legal-card h2{font:400 1.45rem Georgia,serif}.legal-card p,.legal-card li{color:var(--muted);line-height:1.75;font-size:.82rem}.legal-note{display:flex;gap:.75rem;margin-top:1rem;padding:1rem;border-radius:12px;background:#fff8e8;color:#775207;font-size:.72rem}
  `]
})
export class LegalPageComponent {
  readonly document: LegalDocument;
  constructor(route: ActivatedRoute) { this.document = DOCUMENTS[route.snapshot.data['legalType']] ?? DOCUMENTS['notice']; }
}
