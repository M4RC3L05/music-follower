import timers from "node:timers/promises";

import { describe, expect, jest, test } from "@jest/globals";

import { run } from "#src/apps/jobs/sync-releases/task.js";
import artistRepository from "#src/data/artist/repositories/artist-repository.js";
import type { ItunesResponseModel } from "#src/data/itunes/models/itunes-response-model.js";
import itunesLookupRepository from "#src/data/itunes/repositories/itunes-lookup-repository.js";
import releaseRepository from "#src/data/release/repositories/release-repository.js";
import * as fixtures from "#tests/fixtures/index.js";

describe("task", () => {
  test("it should not do work if no artists exists", async () => {
    jest.spyOn(artistRepository, "getArtists");
    jest.spyOn(itunesLookupRepository, "getAllLatestReleasesFromArtist");

    await run();

    expect(artistRepository.getArtists).toHaveBeenCalledTimes(1);
    expect(itunesLookupRepository.getAllLatestReleasesFromArtist).toHaveBeenCalledTimes(0);
  });

  test("it should continue if both album and music releases failed", async () => {
    await fixtures.loadArtist({ id: 1, imageUrl: "foo", name: "bar" });
    const artist2 = await fixtures.loadArtist({ id: 2, imageUrl: "foo", name: "bar" });

    const songRelease = fixtures.loadItunesLookupSong({ releaseDate: new Date().toISOString() });
    const albumRelease = fixtures.loadItunesLookupAlbum({ releaseDate: new Date().toISOString() });

    fixtures.getLatestsArtistMusicReleases(500, "Internal Server Error");
    fixtures.getLatestsArtistMusicReleases(500, "Internal Server Error");
    fixtures.getLatestsArtistMusicReleases(200, {
      resultCount: 0,
      results: [{}, songRelease],
    } as ItunesResponseModel<Record<string, unknown>>);
    fixtures.getLatestsArtistMusicReleases(200, {
      resultCount: 0,
      results: [{}, albumRelease],
    } as ItunesResponseModel<Record<string, unknown>>);

    jest.spyOn(timers, "setTimeout").mockResolvedValue("");
    jest.spyOn(itunesLookupRepository, "getAllLatestReleasesFromArtist");
    jest.spyOn(releaseRepository, "upsertReleases").mockResolvedValue();

    await run();

    expect(itunesLookupRepository.getAllLatestReleasesFromArtist).toHaveBeenCalledTimes(2);
    expect(releaseRepository.upsertReleases).toHaveBeenCalledTimes(2);
    expect(releaseRepository.upsertReleases).toHaveBeenNthCalledWith(1, artist2.id, [
      expect.objectContaining({ id: albumRelease.collectionId, metadata: albumRelease }),
    ]);
    expect(releaseRepository.upsertReleases).toHaveBeenNthCalledWith(2, artist2.id, [
      expect.objectContaining({ id: songRelease.trackId, metadata: songRelease }),
    ]);
  });

  test("it should not include release if released year is not the current one", async () => {
    const artist = await fixtures.loadArtist({ id: 1, imageUrl: "foo", name: "bar" });

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const songRelease = fixtures.loadItunesLookupSong({ releaseDate: now.toISOString() });
    const songRelease2 = fixtures.loadItunesLookupSong({
      releaseDate: now.toISOString().replace(String(currentYear), String(currentYear - 1)),
    });
    const albumRelease = fixtures.loadItunesLookupAlbum({ releaseDate: now.toISOString() });
    const albumRelease2 = fixtures.loadItunesLookupAlbum({
      releaseDate: now.toISOString().replace(String(currentYear), String(currentYear - 1)),
    });

    fixtures.getLatestsArtistMusicReleases(200, {
      resultCount: 0,
      results: [{}, songRelease, songRelease2],
    } as ItunesResponseModel<Record<string, unknown>>);
    fixtures.getLatestsArtistMusicReleases(200, {
      resultCount: 0,
      results: [{}, albumRelease, albumRelease2],
    } as ItunesResponseModel<Record<string, unknown>>);

    jest.spyOn(timers, "setTimeout").mockResolvedValue("");
    jest.spyOn(itunesLookupRepository, "getAllLatestReleasesFromArtist");
    jest.spyOn(releaseRepository, "upsertReleases").mockResolvedValue();

    await run();

    expect(itunesLookupRepository.getAllLatestReleasesFromArtist).toHaveBeenCalledTimes(1);
    expect(releaseRepository.upsertReleases).toHaveBeenCalledTimes(2);
    expect(releaseRepository.upsertReleases).toHaveBeenNthCalledWith(1, artist.id, [
      expect.objectContaining({ id: albumRelease.collectionId, metadata: albumRelease }),
    ]);
    expect(releaseRepository.upsertReleases).toHaveBeenNthCalledWith(2, artist.id, [
      expect.objectContaining({ id: songRelease.trackId, metadata: songRelease }),
    ]);
  });

  test("it should not include release if release is a compilation", async () => {
    const artist = await fixtures.loadArtist({ id: 1, imageUrl: "foo", name: "bar" });

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const songRelease = fixtures.loadItunesLookupSong({ releaseDate: now.toISOString() });
    const songRelease2 = fixtures.loadItunesLookupSong({
      releaseDate: now.toISOString(),
      collectionArtistName: "Various Artists",
    });

    fixtures.getLatestsArtistMusicReleases(200, {
      resultCount: 0,
      results: [{}, songRelease, songRelease2],
    } as ItunesResponseModel<Record<string, unknown>>);
    fixtures.getLatestsArtistMusicReleases(200, {
      resultCount: 0,
      results: [{}],
    } as ItunesResponseModel<Record<string, unknown>>);

    jest.spyOn(timers, "setTimeout").mockResolvedValue("");
    jest.spyOn(itunesLookupRepository, "getAllLatestReleasesFromArtist");
    jest.spyOn(releaseRepository, "upsertReleases").mockResolvedValue();

    await run();

    expect(itunesLookupRepository.getAllLatestReleasesFromArtist).toHaveBeenCalledTimes(1);
    expect(releaseRepository.upsertReleases).toHaveBeenCalledTimes(2);
    expect(releaseRepository.upsertReleases).toHaveBeenNthCalledWith(1, artist.id, []);
    expect(releaseRepository.upsertReleases).toHaveBeenNthCalledWith(2, artist.id, [
      expect.objectContaining({ id: songRelease.trackId, metadata: songRelease }),
    ]);
  });

  test("it should skip if no usable release is found", async () => {
    await fixtures.loadArtist({ id: 1, imageUrl: "foo", name: "bar" });

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const albumRelease = fixtures.loadItunesLookupAlbum({
      releaseDate: now.toISOString().replace(String(currentYear), String(currentYear - 1)),
    });
    const songRelease = fixtures.loadItunesLookupSong({
      releaseDate: now.toISOString(),
      collectionArtistName: "Various Artists",
    });

    fixtures.getLatestsArtistMusicReleases(200, {
      resultCount: 0,
      results: [{}, songRelease],
    } as ItunesResponseModel<Record<string, unknown>>);
    fixtures.getLatestsArtistMusicReleases(200, {
      resultCount: 0,
      results: [{}, albumRelease],
    } as ItunesResponseModel<Record<string, unknown>>);

    jest.spyOn(timers, "setTimeout").mockResolvedValue("");
    jest.spyOn(itunesLookupRepository, "getAllLatestReleasesFromArtist");
    jest.spyOn(releaseRepository, "upsertReleases").mockResolvedValue();

    await run();

    expect(itunesLookupRepository.getAllLatestReleasesFromArtist).toHaveBeenCalledTimes(1);
    expect(releaseRepository.upsertReleases).toHaveBeenCalledTimes(0);
  });
});
