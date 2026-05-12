import { Label } from "./Label.jsx";

export function TextArea({ label, value, onChange }) {
  return (
    <label className="mt-3 block">
      <Label>{label}</Label>
      <textarea className="input min-h-32 resize-y" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
