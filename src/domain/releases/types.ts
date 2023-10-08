export type Release = {
  id: number;
  artistName: string;
  name: string;
  releasedAt: Date;
  coverUrl: string;
  type: string;
  hidden: string[];
  metadata: Record<string, any>;
  feedAt: Date;
};
