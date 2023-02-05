/* eslint-disable import/no-named-as-default-member */

import { afterEach, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert";

import config from "config";
import sinon from "sinon";

import * as fixtures from "#src/utils/tests/fixtures/mod.js";
import * as hooks from "#src/utils/tests/hooks/mod.js";
import { feedMiddleware } from "#src/apps/feed/middlewares/feed-middleware.js";

describe("feedMiddleware()", () => {
  before(async () => {
    await hooks.database.migrate();
  });

  beforeEach(() => {
    sinon.useFakeTimers(0);
  });

  afterEach(() => {
    sinon.restore();
    sinon.reset();
  });

  it("should fallback to rss if no accepts header is sent", async () => {
    const ctx = { request: { accepts: () => false } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/xml");
    assert.strict.equal(
      (ctx as any).body,
      '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<rss version="2.0">\n' +
        "    <channel>\n" +
        "        <title>Music releases</title>\n" +
        "        <link>undefined</link>\n" +
        "        <description>Get the latest music releases from artist you follow</description>\n" +
        "        <lastBuildDate>Thu, 01 Jan 1970 00:00:00 GMT</lastBuildDate>\n" +
        "        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>\n" +
        "        <generator>Music Follower</generator>\n" +
        "        <language>en</language>\n" +
        "        <copyright>Music Follower</copyright>\n" +
        "    </channel>\n" +
        "</rss>",
    );
  });

  it("should send rss feed if it accepts `application/xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/xml" } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/xml");
    assert.strict.equal(
      (ctx as any).body,
      '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<rss version="2.0">\n' +
        "    <channel>\n" +
        "        <title>Music releases</title>\n" +
        "        <link>undefined</link>\n" +
        "        <description>Get the latest music releases from artist you follow</description>\n" +
        "        <lastBuildDate>Thu, 01 Jan 1970 00:00:00 GMT</lastBuildDate>\n" +
        "        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>\n" +
        "        <generator>Music Follower</generator>\n" +
        "        <language>en</language>\n" +
        "        <copyright>Music Follower</copyright>\n" +
        "    </channel>\n" +
        "</rss>",
    );
  });

  it("should send rss feed if it accepts `application/rss+xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/rss+xml" } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/rss+xml");
    assert.strict.equal(
      (ctx as any).body,
      '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<rss version="2.0">\n' +
        "    <channel>\n" +
        "        <title>Music releases</title>\n" +
        "        <link>undefined</link>\n" +
        "        <description>Get the latest music releases from artist you follow</description>\n" +
        "        <lastBuildDate>Thu, 01 Jan 1970 00:00:00 GMT</lastBuildDate>\n" +
        "        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>\n" +
        "        <generator>Music Follower</generator>\n" +
        "        <language>en</language>\n" +
        "        <copyright>Music Follower</copyright>\n" +
        "    </channel>\n" +
        "</rss>",
    );
  });

  it("should send atom feed if it accepts `application/atom+xml`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/atom+xml" } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/atom+xml");
    assert.strict.equal(
      (ctx as any).body,
      '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<feed xmlns="http://www.w3.org/2005/Atom">\n' +
        "    <id>music_follower</id>\n" +
        "    <title>Music releases</title>\n" +
        "    <updated>1970-01-01T00:00:00.000Z</updated>\n" +
        "    <generator>Music Follower</generator>\n" +
        "    <subtitle>Get the latest music releases from artist you follow</subtitle>\n" +
        "    <rights>Music Follower</rights>\n" +
        "</feed>",
    );
  });

  it("should send json feed if it accepts `application/json`", async () => {
    const ctx = { request: { accepts: (x: any) => x === "application/json" } };

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/json");
    assert.strict.equal(
      (ctx as any).body,
      "{\n" +
        '    "version": "https://jsonfeed.org/version/1",\n' +
        '    "title": "Music releases",\n' +
        '    "description": "Get the latest music releases from artist you follow",\n' +
        '    "items": []\n' +
        "}",
    );
  });

  for (const ct of ["application/rss+xml", "application/atom+xml", "application/json"]) {
    it(`should send feed with elements for "${ct}"`, async () => {
      const ctx = { request: { accepts: (x: any) => x === ct } };

      hooks.database.cleanup();
      fixtures.releases.load({ id: 1, feedAt: new Date(0) });
      fixtures.releases.load({ id: 2, feedAt: new Date(500) });
      fixtures.releases.load({ id: 3, feedAt: new Date(1000) });
      fixtures.releases.load({ id: 4, feedAt: new Date(1500) });

      sinon.stub(config, "get").returns(3);

      feedMiddleware(ctx as any);

      assert.strict.equal((ctx as any).type, ct);
      assert.strict.equal(
        (ctx as any).body,
        ct === "application/rss+xml"
          ? '<?xml version="1.0" encoding="utf-8"?>\n' +
              '<rss version="2.0">\n' +
              "    <channel>\n" +
              "        <title>Music releases</title>\n" +
              "        <link>undefined</link>\n" +
              "        <description>Get the latest music releases from artist you follow</description>\n" +
              "        <lastBuildDate>Thu, 01 Jan 1970 00:00:00 GMT</lastBuildDate>\n" +
              "        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>\n" +
              "        <generator>Music Follower</generator>\n" +
              "        <language>en</language>\n" +
              "        <copyright>Music Follower</copyright>\n" +
              "        <item>\n" +
              "            <title><![CDATA[bar by foo]]></title>\n" +
              "            <link>http://foo.bix</link>\n" +
              "            <guid>4</guid>\n" +
              "            <pubDate>Thu, 01 Jan 1970 00:00:01 GMT</pubDate>\n" +
              '            <description><![CDATA[<img src="http://foo.bix" />\n' +
              "      <h1>bar</h1><p>foo</p>\n" +
              "      <p>1970</p>]]></description>\n" +
              "        </item>\n" +
              "        <item>\n" +
              "            <title><![CDATA[bar by foo]]></title>\n" +
              "            <link>http://foo.bix</link>\n" +
              "            <guid>3</guid>\n" +
              "            <pubDate>Thu, 01 Jan 1970 00:00:01 GMT</pubDate>\n" +
              '            <description><![CDATA[<img src="http://foo.bix" />\n' +
              "      <h1>bar</h1><p>foo</p>\n" +
              "      <p>1970</p>]]></description>\n" +
              "        </item>\n" +
              "        <item>\n" +
              "            <title><![CDATA[bar by foo]]></title>\n" +
              "            <link>http://foo.bix</link>\n" +
              "            <guid>2</guid>\n" +
              "            <pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>\n" +
              '            <description><![CDATA[<img src="http://foo.bix" />\n' +
              "      <h1>bar</h1><p>foo</p>\n" +
              "      <p>1970</p>]]></description>\n" +
              "        </item>\n" +
              "    </channel>\n" +
              "</rss>"
          : ct === "application/atom+xml"
          ? '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<feed xmlns="http://www.w3.org/2005/Atom">\n' +
            "    <id>music_follower</id>\n" +
            "    <title>Music releases</title>\n" +
            "    <updated>1970-01-01T00:00:00.000Z</updated>\n" +
            "    <generator>Music Follower</generator>\n" +
            "    <subtitle>Get the latest music releases from artist you follow</subtitle>\n" +
            "    <rights>Music Follower</rights>\n" +
            "    <entry>\n" +
            '        <title type="html"><![CDATA[bar by foo]]></title>\n' +
            "        <id>4</id>\n" +
            '        <link href="http://foo.bix"/>\n' +
            "        <updated>1970-01-01T00:00:01.500Z</updated>\n" +
            '        <summary type="html"><![CDATA[<img src="http://foo.bix" />\n' +
            "      <h1>bar</h1><p>foo</p>\n" +
            "      <p>1970</p>]]></summary>\n" +
            "    </entry>\n" +
            "    <entry>\n" +
            '        <title type="html"><![CDATA[bar by foo]]></title>\n' +
            "        <id>3</id>\n" +
            '        <link href="http://foo.bix"/>\n' +
            "        <updated>1970-01-01T00:00:01.000Z</updated>\n" +
            '        <summary type="html"><![CDATA[<img src="http://foo.bix" />\n' +
            "      <h1>bar</h1><p>foo</p>\n" +
            "      <p>1970</p>]]></summary>\n" +
            "    </entry>\n" +
            "    <entry>\n" +
            '        <title type="html"><![CDATA[bar by foo]]></title>\n' +
            "        <id>2</id>\n" +
            '        <link href="http://foo.bix"/>\n' +
            "        <updated>1970-01-01T00:00:00.500Z</updated>\n" +
            '        <summary type="html"><![CDATA[<img src="http://foo.bix" />\n' +
            "      <h1>bar</h1><p>foo</p>\n" +
            "      <p>1970</p>]]></summary>\n" +
            "    </entry>\n" +
            "</feed>"
          : "{\n" +
            '    "version": "https://jsonfeed.org/version/1",\n' +
            '    "title": "Music releases",\n' +
            '    "description": "Get the latest music releases from artist you follow",\n' +
            '    "items": [\n' +
            "        {\n" +
            '            "id": "4",\n' +
            '            "url": "http://foo.bix",\n' +
            '            "title": "bar by foo",\n' +
            '            "summary": "<img src=\\"http://foo.bix\\" />\\n      <h1>bar</h1><p>foo</p>\\n      <p>1970</p>",\n' +
            '            "date_modified": "1970-01-01T00:00:01.500Z"\n' +
            "        },\n" +
            "        {\n" +
            '            "id": "3",\n' +
            '            "url": "http://foo.bix",\n' +
            '            "title": "bar by foo",\n' +
            '            "summary": "<img src=\\"http://foo.bix\\" />\\n      <h1>bar</h1><p>foo</p>\\n      <p>1970</p>",\n' +
            '            "date_modified": "1970-01-01T00:00:01.000Z"\n' +
            "        },\n" +
            "        {\n" +
            '            "id": "2",\n' +
            '            "url": "http://foo.bix",\n' +
            '            "title": "bar by foo",\n' +
            '            "summary": "<img src=\\"http://foo.bix\\" />\\n      <h1>bar</h1><p>foo</p>\\n      <p>1970</p>",\n' +
            '            "date_modified": "1970-01-01T00:00:00.500Z"\n' +
            "        }\n" +
            "    ]\n" +
            "}",
      );
    });
  }

  it("should detect correctly the feed item link", async () => {
    const ctx = { request: { accepts: (x: any) => false } };

    hooks.database.cleanup();
    fixtures.releases.load({
      id: 1,
      type: "track",
      metadata: { trackViewUrl: "foo", collectionViewUrl: "bar" },
      feedAt: new Date(0),
      coverUrl: "bix",
    });
    fixtures.releases.load({
      id: 2,
      type: "track",
      metadata: { trackViewUrl: undefined, collectionViewUrl: "bar" },
      feedAt: new Date(1),
      coverUrl: "bix",
    });
    fixtures.releases.load({
      id: 3,
      type: "track",
      metadata: { trackViewUrl: undefined, collectionViewUrl: undefined },
      feedAt: new Date(2),
      coverUrl: "bix",
    });
    fixtures.releases.load({
      id: 2,
      type: "collection",
      metadata: { collectionViewUrl: "foo" },
      feedAt: new Date(3),
      coverUrl: "bux",
    });
    fixtures.releases.load({
      id: 3,
      type: "collection",
      metadata: { collectionViewUrl: undefined },
      feedAt: new Date(4),
      coverUrl: "bux",
    });
    fixtures.releases.load({
      id: 1,
      type: "bix",
      metadata: { collectionViewUrl: undefined },
      feedAt: new Date(5),
      coverUrl: "bux",
    });

    sinon.stub(config, "get").returns(10);

    feedMiddleware(ctx as any);

    assert.strict.equal((ctx as any).type, "application/xml");
    assert.strict.equal(
      (ctx as any).body,
      '<?xml version="1.0" encoding="utf-8"?>\n' +
        '<rss version="2.0">\n' +
        "    <channel>\n" +
        "        <title>Music releases</title>\n" +
        "        <link>undefined</link>\n" +
        "        <description>Get the latest music releases from artist you follow</description>\n" +
        "        <lastBuildDate>Thu, 01 Jan 1970 00:00:00 GMT</lastBuildDate>\n" +
        "        <docs>https://validator.w3.org/feed/docs/rss2.html</docs>\n" +
        "        <generator>Music Follower</generator>\n" +
        "        <language>en</language>\n" +
        "        <copyright>Music Follower</copyright>\n" +
        "        <item>\n" +
        "            <title><![CDATA[bar by foo]]></title>\n" +
        "            <link>bux</link>\n" +
        "            <guid>1</guid>\n" +
        "            <pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>\n" +
        '            <description><![CDATA[<img src="bux" />\n' +
        "      <h1>bar</h1><p>foo</p>\n" +
        "      <p>1970</p>]]></description>\n" +
        "        </item>\n" +
        "        <item>\n" +
        "            <title><![CDATA[bar by foo]]></title>\n" +
        "            <link>bux</link>\n" +
        "            <guid>3</guid>\n" +
        "            <pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>\n" +
        '            <description><![CDATA[<img src="bux" />\n' +
        "      <h1>bar</h1><p>foo</p>\n" +
        "      <p>1970</p>]]></description>\n" +
        "        </item>\n" +
        "        <item>\n" +
        "            <title><![CDATA[bar by foo]]></title>\n" +
        "            <link>foo</link>\n" +
        "            <guid>2</guid>\n" +
        "            <pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>\n" +
        '            <description><![CDATA[<img src="bux" />\n' +
        "      <h1>bar</h1><p>foo</p>\n" +
        "      <p>1970</p>]]></description>\n" +
        "        </item>\n" +
        "        <item>\n" +
        "            <title><![CDATA[bar by foo]]></title>\n" +
        "            <link>bix</link>\n" +
        "            <guid>3</guid>\n" +
        "            <pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>\n" +
        '            <description><![CDATA[<img src="bix" />\n' +
        "      <h1>bar</h1><p>foo</p>\n" +
        "      <p>1970</p>]]></description>\n" +
        "        </item>\n" +
        "        <item>\n" +
        "            <title><![CDATA[bar by foo]]></title>\n" +
        "            <link>bar</link>\n" +
        "            <guid>2</guid>\n" +
        "            <pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>\n" +
        '            <description><![CDATA[<img src="bix" />\n' +
        "      <h1>bar</h1><p>foo</p>\n" +
        "      <p>1970</p>]]></description>\n" +
        "        </item>\n" +
        "        <item>\n" +
        "            <title><![CDATA[bar by foo]]></title>\n" +
        "            <link>foo</link>\n" +
        "            <guid>1</guid>\n" +
        "            <pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>\n" +
        '            <description><![CDATA[<img src="bix" />\n' +
        "      <h1>bar</h1><p>foo</p>\n" +
        "      <p>1970</p>]]></description>\n" +
        "        </item>\n" +
        "    </channel>\n" +
        "</rss>",
    );
  });
});
