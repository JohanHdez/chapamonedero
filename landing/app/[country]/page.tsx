import Image from "next/image";
import { notFound } from "next/navigation";
import CompraForm from "../components/CompraForm";
import { isSupportedCountry } from "../../lib/countries";
// Precio de PRESENTACIÓN por país (SOLO UI). El precio autoritativo lo aplica el
// servidor (lib/mercadopago.ts); aquí solo se pinta la tarjeta de precio.
import { UI_BY_COUNTRY, fmt } from "../components/pricing-display";

/** Genera estáticamente las dos rutas de país soportadas. */
export function generateStaticParams() {
  return [{ country: "mx" }, { country: "co" }];
}

export default function Home({ params }: { params: { country: string } }) {
  const { country } = params;
  if (!isSupportedCountry(country)) notFound();

  const price = UI_BY_COUNTRY[country];

  return (
    <>
      <header className="container">
        <nav className="nav">
          <a href={`/${country}`} className="brand" aria-label="Chapa Monedero">
            <Image
              className="brand-logo"
              src="/logo-chapamonedero.png"
              alt="Chapa Monedero"
              width={245}
              height={34}
              priority
            />
          </a>
          <div className="nav-links">
            <a href="#features">Beneficios</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#comprar">Comprar</a>
          </div>
          <a href="#comprar" className="btn btn-cta nav-cta">
            Comprar ahora
          </a>
        </nav>
      </header>

      {/* HERO — póster vertical mobile-first (una columna, producto protagonista) */}
      <main>
        <section className="poster">
          <div className="container poster-inner">

            {/* Única h1 de la página */}
            <h1 className="poster-heading">
              <span className="poster-eyebrow">Somos</span>
              <span className="poster-title">
                <span className="line-1">Fabricantes</span>
                <span className="line-2">Directos</span>
              </span>
              <span className="poster-rule" aria-hidden="true" />
              <span className="poster-subtitle">Chapa Monedero Industrial</span>
            </h1>

            <div className="poster-product">
              {/* Mobile: foto vertical del producto sobre pedestal de mármol (hero-mobile.jpeg).
                  Desktop: se conserva el hero-desktop.jpeg actual (full-bleed con overlay).
                  El toggle mobile/desktop se resuelve por CSS en globals.css. */}
              <Image
                className="poster-product-img poster-product-img--mobile"
                src="/hero-mobile.jpeg"
                alt="Cerradura Chapa Monedero: chapa mecánica de cobro a moneda montada sobre un pedestal de mármol"
                width={1023}
                height={1537}
                priority
              />
              <Image
                className="poster-product-img poster-product-img--desktop"
                src="/hero-desktop.jpeg"
                alt="Cerradura Chapa Monedero: chapa mecánica de cobro a moneda para puertas de baños públicos"
                width={1120}
                height={630}
                priority
              />
            </div>

            <p className="poster-value">
              Soluciones de seguridad diseñadas para{" "}
              <strong>proteger</strong> y <strong>generar ingresos</strong> en
              baños públicos.
            </p>

            {/* Tarjeta de precio — SOLO UI. El precio real lo aplica el servidor. */}
            <div className="poster-price">
              <span className="poster-price-label">Precio directo de fábrica</span>
              <span className="poster-price-amount">{fmt(country, price.unit)}</span>
              <span className="poster-price-currency">
                {price.currency} · por unidad
              </span>
            </div>

            {/* TODO: confirmar si hay obsequio; si no, usar "COMPRAR AHORA" */}
            <a href="#comprar" className="btn btn-cta poster-cta">
              <i className="fa fa-gift" aria-hidden="true" /> Comprar ahora con
              obsequio
            </a>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="section">
          <div className="container">
            <h2>Tu baño, una fuente de ingresos</h2>
            <p className="lead">
              Un dispositivo pensado para dueños de comercios que quieren
              recaudar por el uso del baño, sin complicaciones ni tecnología
              que mantener.
            </p>
            <div className="grid">
              <div className="feature">
                <div className="ic fa fa-magic" aria-hidden="true" />
                <h3>Recaudo automático</h3>
                <p>
                  La puerta solo abre al depositar la moneda. Cada uso del baño
                  se convierte en un ingreso directo para tu negocio.
                </p>
              </div>
              <div className="feature">
                <div className="ic fa fa-bolt" aria-hidden="true" />
                <h3>100% mecánica</h3>
                <p>
                  No usa pilas, electricidad ni internet. Funciona siempre, sin
                  fallas técnicas ni costos de operación.
                </p>
              </div>
              <div className="feature">
                <div className="ic fa fa-shield" aria-hidden="true" />
                <h3>Resistente y segura</h3>
                <p>
                  Construida para uso intensivo en baños públicos. Guarda las
                  monedas de forma segura hasta que las retires.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2>Cómo funciona</h2>
            <p className="lead">
              Instálala una vez y empieza a recaudar desde el primer día.
            </p>
            <div className="grid">
              <div className="feature">
                <div className="ic fa fa-wrench" aria-hidden="true" />
                <h3>1. Instálala</h3>
                <p>
                  Se monta en la puerta del baño con herramientas básicas. No
                  requiere obra ni instalación eléctrica.
                </p>
              </div>
              <div className="feature">
                <div className="ic fa fa-unlock-alt" aria-hidden="true" />
                <h3>2. El cliente paga</h3>
                <p>
                  La persona deposita la moneda y la cerradura libera la puerta
                  para que pueda entrar.
                </p>
              </div>
              <div className="feature">
                <div className="ic fa fa-money" aria-hidden="true" />
                <h3>3. Recauda</h3>
                <p>
                  Abres el compartimiento con tu llave y retiras las monedas
                  acumuladas cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MÉTODOS */}
        <section id="metodos" className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2>Paga como prefieras</h2>
            <p className="lead">
              Compra tu Chapa Monedero con los métodos locales de México y
              Colombia a través de Mercado Pago.
            </p>
            <div className="methods">
              <span className="method-chip"><i className="fa fa-credit-card" aria-hidden="true" /> Tarjeta</span>
              <span className="method-chip"><i className="fa fa-shopping-bag" aria-hidden="true" /> OXXO</span>
              <span className="method-chip"><i className="fa fa-university" aria-hidden="true" /> SPEI</span>
              <span className="method-chip">🇨🇴 PSE</span>
              <span className="method-chip"><i className="fa fa-mobile" aria-hidden="true" /> Nequi</span>
              <span className="method-chip"><i className="fa fa-university" aria-hidden="true" /> Bancolombia</span>
            </div>
          </div>
        </section>

        {/* COMPRAR */}
        <section id="comprar" className="section">
          <div className="container">
            <h2>Compra tu Chapa Monedero</h2>
            <p className="lead">
              Elige la cantidad de unidades y completa el pago de forma segura
              con Mercado Pago.
            </p>
            <div className="compra-wrap">
              <CompraForm country={country} />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer container">
        <p className="footer-copy">
          © {new Date().getFullYear()} Chapa Monedero. Todos los derechos
          reservados.
        </p>
        {/* TODO: reemplazar href="#" por las rutas reales cuando existan
            (Términos / Privacidad / Soporte). */}
        <nav className="footer-links" aria-label="Enlaces legales y de soporte">
          <a href="#">Términos</a>
          <span className="footer-sep" aria-hidden="true">
            ·
          </span>
          <a href="#">Privacidad</a>
          <span className="footer-sep" aria-hidden="true">
            ·
          </span>
          <a href="#">Soporte</a>
        </nav>
      </footer>
    </>
  );
}
