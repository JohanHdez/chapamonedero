export default function Pendiente() {
  return (
    <div className="result container">
      <div className="big-ic" style={{ color: "var(--cm-accent)" }}>
        <i className="fa fa-clock-o" aria-hidden="true" />
      </div>
      <h1>Pago pendiente</h1>
      <p>
        Tu pago está en proceso. Si pagaste en efectivo (OXXO) o por
        transferencia, confirmaremos tu pedido en cuanto se acredite el pago.
      </p>
      <p style={{ marginTop: 28 }}>
        <a href="/" className="btn btn-primary">
          Volver al inicio
        </a>
      </p>
    </div>
  );
}
