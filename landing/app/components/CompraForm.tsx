"use client";

import { useEffect, useState } from "react";
import { COUNTRY_CONFIG, countryForHost, type Country } from "../../lib/countries";
// Mapa de PRESENTACIÓN de precios (SOLO UI). El precio autoritativo lo aplica el
// servidor (lib/mercadopago.ts); aquí solo se muestra el total estimado.
import { UI_BY_COUNTRY, fmt as fmtCountry } from "./pricing-display";

const MAX_QTY = 50;

export default function CompraForm({ country }: { country: Country }) {
  const [quantity, setQuantity] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const ui = UI_BY_COUNTRY[country];
  const other: Country = country === "mx" ? "co" : "mx";
  const total = ui.unit * quantity;

  // Enlace al otro país. SSR-safe: por defecto usa la ruta relativa `/${other}`
  // (válida en local y en el dominio propio). En cliente, si estamos en un
  // dominio de producción conocido, saltamos al dominio del OTRO país para no
  // exponer `/mx` ni `/co`.
  const [otherHref, setOtherHref] = useState<string>(`/${other}`);
  useEffect(() => {
    const onKnownDomain = countryForHost(window.location.hostname) !== null;
    setOtherHref(
      onKnownDomain ? `https://${COUNTRY_CONFIG[other].domain}` : `/${other}`
    );
  }, [other]);

  function fmt(value: number) {
    return fmtCountry(country, value);
  }

  function changeQty(delta: number) {
    setQuantity((q) => Math.min(MAX_QTY, Math.max(1, q + delta)));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) {
      setError(`Elige una cantidad entre 1 y ${MAX_QTY} unidades.`);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/checkout/${country}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.init_point) {
        throw new Error(data.error || "No se pudo iniciar el pago.");
      }
      // Redirige al checkout de Mercado Pago
      window.location.href = data.init_point;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo."
      );
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <fieldset className="field" style={{ border: 0, margin: 0, padding: 0 }}>
        <legend
          className="font-sans"
          style={{
            display: "block",
            fontSize: "0.9rem",
            color: "var(--cm-text-muted)",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          País
        </legend>
        <div className="grid grid-cols-2 gap-3" role="group" aria-label="Elige tu país">
          <span
            aria-current="true"
            className="flex items-center justify-center gap-2 rounded-cm border border-cm-primary bg-cm-surface-2 px-3 py-3 font-sans font-semibold text-cm-primary"
          >
            <span aria-hidden="true">{ui.flag}</span> {ui.label} ({ui.currency})
          </span>
          <a
            href={otherHref}
            className="flex items-center justify-center gap-2 rounded-cm border border-cm-border bg-cm-bg-2 px-3 py-3 font-sans font-semibold text-cm-text hover:border-cm-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cm-primary"
            aria-label={`Cambiar a ${UI_BY_COUNTRY[other].label}`}
          >
            <span aria-hidden="true">{UI_BY_COUNTRY[other].flag}</span>{" "}
            Cambiar a {UI_BY_COUNTRY[other].label}
          </a>
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="quantity">Cantidad de chapas</label>
        <div className="qty">
          <button
            type="button"
            aria-label="Quitar una unidad"
            onClick={() => changeQty(-1)}
            disabled={quantity <= 1}
          >
            <i className="fa fa-minus" aria-hidden="true" />
          </button>
          <span className="qty-value" id="quantity" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Agregar una unidad"
            onClick={() => changeQty(1)}
            disabled={quantity >= MAX_QTY}
          >
            <i className="fa fa-plus" aria-hidden="true" />
          </button>
        </div>
        <p className="unit-price">{fmt(ui.unit)} por unidad</p>
      </div>

      <div className="field">
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          className="input"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="total-row">
        <span>Total a pagar</span>
        <strong>
          {fmt(total)} {ui.currency}
        </strong>
      </div>

      {error && <p className="error">{error}</p>}

      <button className="btn btn-cta btn-block" type="submit" disabled={loading}>
        {loading ? (
          "Redirigiendo…"
        ) : (
          <>
            <i className="fa fa-lock" aria-hidden="true" /> Comprar de forma segura
          </>
        )}
      </button>

      <p className="note">
        Serás redirigido a Mercado Pago para completar tu compra de forma segura.
        No almacenamos los datos de tu tarjeta.
      </p>
    </form>
  );
}
