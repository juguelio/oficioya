export type JsonLd = Record<string, unknown>

export type SeoData = {
  /** Se muestra en la pestaña y, sobre todo, es el título del resultado en Google. */
  title: string
  /** El párrafo debajo del título en el resultado. No afecta el ranking; sí el clic. */
  description: string
  /**
   * Ruta absoluta del sitio, empezando con `/`. El hook le antepone el dominio.
   * Sin esto, cada página heredaba el canonical de index.html —que apunta a la
   * home— y eso le dice a Google "no indexes esta página, la buena es la otra".
   */
  path: string
  /** Datos estructurados de la página. Se serializan a un <script type="application/ld+json">. */
  jsonLd?: JsonLd
}
