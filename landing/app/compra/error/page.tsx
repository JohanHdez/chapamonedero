export default function ErrorPago() {
  return (
    <div className="result container">
      <div className="big-ic" style={{ color: "var(--cm-danger)" }}>
        <i className="fa fa-times-circle" aria-hidden="true" />
      </div>
      <h1>No se pudo completar el pago</h1>
      <p>
        Algo salió mal y tu compra no se realizó. No se hizo ningún cargo.
        Puedes intentarlo de nuevo con otro método de pago.
      </p>
      <p style={{ marginTop: 28 }}>
        <a href="/#comprar" className="btn btn-primary">
          Intentar de nuevo
        </a>
      </p>
    </div>
  );
}
