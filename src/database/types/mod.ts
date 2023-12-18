export type Artist = {
  id: number;
  name: string;
  imageUrl: string;
};

export type Release = {
  id: number;
  artistName: string;
  name: string;
  releasedAt: string;
  coverUrl: string;
  type: string;
  hidden: string;
  metadata: string;
  feedAt: string;
};
