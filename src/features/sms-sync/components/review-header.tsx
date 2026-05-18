import { NestedScreenHeader } from "@/components/base";

export function ReviewHeader() {
  // Shared header keeps the loading, empty, and populated review states aligned.
  return (
    <NestedScreenHeader
      description="Confirm parsed bank and payment messages before they become transactions."
      overline="SMS REVIEW"
      title="Review imported SMS"
    />
  );
}
