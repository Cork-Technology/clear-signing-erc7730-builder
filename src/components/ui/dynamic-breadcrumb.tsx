"use client";

import { Slash } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { useNavigation } from "~/hooks/use-navigation";

export function DynamicBreadcrumb() {
  const { getStepsUpToCurrent } = useNavigation();
  const steps = getStepsUpToCurrent();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {steps
          .filter((step) => step !== undefined)
          .map((step, index) => (
            <div key={step.href} className="flex items-center">
              {index > 0 && (
                <BreadcrumbSeparator>
                  <Slash />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem>
                {step.isActive ? (
                  <BreadcrumbPage>{step.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={step.href}>{step.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
