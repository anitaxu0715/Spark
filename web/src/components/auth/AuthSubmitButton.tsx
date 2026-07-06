"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

export function AuthSubmitButton({ children, pendingLabel }: { children: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? pendingLabel : children}
    </Button>
  );
}
