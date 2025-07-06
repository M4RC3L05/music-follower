export type Artist = {
  id: number;
  name: string;
  image: string;
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
