import { Label } from "./Label.jsx";

export function NumberField({ label, value, onChange, step = 1 }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        className="input"
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
