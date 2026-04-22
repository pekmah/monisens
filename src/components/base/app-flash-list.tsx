import { FlashList, type FlashListProps } from "@shopify/flash-list";

export type AppFlashListProps<TItem> = FlashListProps<TItem>;

export function AppFlashList<TItem>(props: AppFlashListProps<TItem>) {
  return (
    <FlashList
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      {...props}
    />
  );
}

export default AppFlashList;
