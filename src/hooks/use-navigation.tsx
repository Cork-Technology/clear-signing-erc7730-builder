"use client";

import { usePathname } from "next/navigation";

export interface NavigationStep {
  label: string;
  href: string;
  isActive: boolean;
}

export function useNavigation() {
  const pathname = usePathname();

  const pathState = {
    isHome: pathname === "/",
    isChains: pathname === "/chains",
    isMetadata: pathname === "/metadata",
    isOperations: pathname === "/operations",
    isReview: pathname === "/review",
    showNavigationSteps: pathname !== "/",
  };

  const navigationSteps: NavigationStep[] = [
    { label: "Home", href: "/", isActive: pathState.isHome },
    { label: "Chains", href: "/chains", isActive: pathState.isChains },
    {
      label: "Metadata",
      href: "/metadata",
      isActive: pathState.isMetadata,
    },
    {
      label: "Operations",
      href: "/operations",
      isActive: pathState.isOperations,
    },
    { label: "Review", href: "/review", isActive: pathState.isReview },
  ];

  const getCurrentStep = () => {
    return navigationSteps.find((step) => step.isActive) ?? navigationSteps[0];
  };

  const getStepsUpToCurrent = () => {
    const currentStepIndex = navigationSteps.findIndex((step) => step.isActive);
    return currentStepIndex >= 0
      ? navigationSteps.slice(0, currentStepIndex + 1)
      : [navigationSteps[0]];
  };

  const isOnNavigationPath = () => {
    return navigationSteps.some((step) => step.isActive);
  };

  return {
    pathname,
    navigationSteps,
    getCurrentStep,
    getStepsUpToCurrent,
    isOnNavigationPath,
    pathState,
  };
}
