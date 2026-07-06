import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const fieldControl = isValidElement(children)
    ? children as ReactElement<{
        "aria-describedby"?: string;
        "aria-invalid"?: boolean;
      }>
    : null;
  const control = fieldControl
    ? cloneElement(fieldControl, {
        "aria-describedby": [
          fieldControl.props["aria-describedby"],
          descriptionId,
        ].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : fieldControl.props["aria-invalid"],
      })
    : children;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-indigo-950" htmlFor={id}>
        {label}
      </label>
      {control}
      {error ? (
        <p className="text-sm font-medium text-red-700" id={descriptionId} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-ink-500" id={descriptionId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
