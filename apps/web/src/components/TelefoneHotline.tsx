/**
 * Telefone de disco desenhado à mão para o Threshold (SVG original, sem ícones de terceiros).
 * Decorativo: quem lê a tela ouve o texto ao lado, não o desenho.
 */
export function TelefoneHotline({ tamanho = 44 }: { tamanho?: number }) {
  const furos = Array.from({ length: 10 }, (_, i) => {
    const angulo = (-60 + i * 30) * (Math.PI / 180);
    return { x: 24 + Math.cos(angulo) * 6.2, y: 31 + Math.sin(angulo) * 6.2 };
  });
  return (
    <svg className="telefone" width={tamanho} height={tamanho} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {/* fone no gancho */}
      <path
        className="telefone__fone"
        d="M7 15c0-4 7-7 17-7s17 3 17 7v2.5c0 1.4-1.1 2.5-2.5 2.5h-5c-1.4 0-2.5-1.1-2.5-2.5V16c-2.3-.6-4.6-.8-7-.8s-4.7.2-7 .8v1.5C17 18.9 15.9 20 14.5 20h-5C8.1 20 7 18.9 7 17.5Z"
      />
      {/* corpo */}
      <path className="telefone__corpo" d="M13 22h22l6 19a2 2 0 0 1-1.9 2.6H8.9A2 2 0 0 1 7 41l6-19Z" />
      {/* disco */}
      <circle cx="24" cy="31" r="9" className="telefone__disco" />
      {furos.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r="1.5" className="telefone__furo" />
      ))}
      <circle cx="24" cy="31" r="2.6" className="telefone__centro" />
    </svg>
  );
}
