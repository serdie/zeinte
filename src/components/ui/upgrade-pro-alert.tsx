
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Rocket, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UpgradeProAlertProps {
  featureName: string;
  className?: string;
  message?: string;
}

export function UpgradeProAlert({ featureName, className, message }: UpgradeProAlertProps) {
  return (
    <Alert variant="default" className={cn("bg-amber-500/10 border-amber-500/50 text-amber-700 dark:bg-amber-700/20 dark:text-amber-400 dark:border-amber-600", className)}>
      <Rocket className="h-5 w-5" />
      <AlertTitle className="font-semibold">¡Desbloquea Funcionalidad Pro!</AlertTitle>
      <AlertDescription>
        {message || `La característica "${featureName}" está disponible en nuestro Plan Pro.`}
        <Link href="/#pricing" passHref>
          <Button variant="link" className="p-0 h-auto text-amber-700 dark:text-amber-400 hover:underline ml-1 font-medium group">
            Actualiza ahora
            <ExternalLink className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
        para acceder a todas las ventajas.
      </AlertDescription>
    </Alert>
  );
}
