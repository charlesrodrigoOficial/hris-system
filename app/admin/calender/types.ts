export type SearchParams = Promise<{
  month?: string;
}>;

export type LegendItem = {
  label: string;
  color: string;
};

export type EventStyle = {
  backgroundColor: string;
  borderColor: string;
  color: string;
};
