import { Label } from "./Label.jsx";

export function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
