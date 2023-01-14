export type Release = {
  id: number;
  artistName: string;
  name: string;
  releasedAt: Date;
  coverUrl: string;
  type: string;
  metadata: Record<string, any>;
  feedAt: Date;
};
