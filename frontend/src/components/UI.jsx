export function Header({ title, subtitle }) {
  return (
    <div className="header">
      <h1 className="title">{title}</h1>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  );
}

export function Card({ title, children, className = "" }) {
  return (
    <section className={`card ${className}`.trim()}>
      {title && <h2 className="section-title">{title}</h2>}
      {children}
    </section>
  );
}

export function Button({ children, className = "", ...props }) {
  return (
    <button className={`button ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
