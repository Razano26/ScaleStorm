"use client";

import { QueryClientProvider as RQProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { queryClient } from "@lib/queryClient";

interface Props {
  children: ReactNode;
}

export function QueryClientProvider({ children }: Props) {
  return <RQProvider client={queryClient}>{children}</RQProvider>;
}
