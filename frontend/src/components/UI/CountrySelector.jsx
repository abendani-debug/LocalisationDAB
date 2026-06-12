// frontend/src/components/UI/CountrySelector.jsx
// Convertit un code ISO 2 lettres en emoji drapeau (ex: 'FR' → '🇫🇷')
const isoToFlag = (code) =>
  [...code.toUpperCase()].map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');

export default function CountrySelector({ selectedCode, onSelect, paysList = [] }) {
  if (paysList.length <= 1) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      padding: '4px 10px',
    }}>
      <select
        value={selectedCode || ''}
        onChange={e => onSelect(e.target.value)}
        style={{
          border: 'none',
          outline: 'none',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          background: 'transparent',
        }}
      >
        {paysList.map(p => (
          <option key={p.code_iso} value={p.code_iso}>
            {isoToFlag(p.code_iso)} {p.nom}
          </option>
        ))}
      </select>
    </div>
  );
}
