export const getArtistImage = async (url: string, signal?: AbortSignal) => {
  const textDecoder = new TextDecoder();
  const response = await fetch(url, {
    signal: signal
      ? AbortSignal.any([AbortSignal.timeout(10_000), signal])
      : AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error("An error ocurred while searching for artist image");
  }

  let html = "";

  if (!response.body) {
    throw new Error("Artists image request has no body");
  }

  for await (const chunk of response.body) {
    html += textDecoder.decode(chunk);

    if (
      /<meta property="og:image".*>/im.test(html) || /<\/head>/im.test(html)
    ) {
      break;
    }
  }

  const result = /<meta\s+property="og:image"\s+content="([^"]*)"/im
    .exec(html)
    ?.at(1);

  if (!result || result.includes("apple-music-")) {
    throw new Error(`Invalid artist image of "${result}"`);
  }

  const imageSplitted = result.split("/");
  const imageFile = imageSplitted.at(-1)?.split(".");

  if (!imageFile) {
    throw new Error(
      `Could not get the image for the artists on result: "${result}"`,
    );
  }

  imageSplitted[imageSplitted.length - 1] = `256x256.${imageFile.at(1)}`;

  return imageSplitted.join("/");
};
