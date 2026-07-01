export default function Exito() {
  return (
    <div className="result container">
      <div className="big-ic" style={{ color: "var(--cm-success)" }}>
        <i className="fa fa-check-circle" aria-hidden="true" />
      </div>
      <h1>¡Compra completada!</h1>
      <p>
        Tu pago se procesó correctamente. Te enviamos el comprobante a tu correo
        y te contactaremos con los datos de envío de tu Chapa Monedero.
      </p>
      <p style={{ marginTop: 28 }}>
        <a href="/" className="btn btn-primary">
          Volver al inicio
        </a>
      </p>
    </div>
  );
}
