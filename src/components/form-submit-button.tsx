"use client";

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
};

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  disabled = false,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button type="submit" className={className} disabled={isDisabled} aria-busy={pending}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
