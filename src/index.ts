import * as cheerio from 'cheerio';
import Fetch from 'node-fetch';
import * as RobotsParser from 'robots-parser';
import { URL } from 'url';

// tslint:disable-next-line: no-var-requires
const version: string = require('../package.json').version;

/**
 * A crawler. Respects <code>robots.txt</code> and will always use the user agent of <code>Spiderboi/[package version]</code>.
 */
class Crawler {
    public url: URL;

    private robots: any;
    private ready = false;

    constructor(url: string) {
        this.url = new URL(url);
    }

    /**
     * Prepares the crawler for crawling. This always needs to be called first.
     * @example
     * // This prepares the crawler for crawling.
     * await Crawler.readyUp();
     */
    public async readyUp() {
        const robotsRequest = await Fetch(new URL('/robots.txt', this.url.origin).href);

        let robotsTxt: string;

        if (!robotsRequest.ok) {
            robotsTxt = '';
        } else {
            robotsTxt = await robotsRequest.text();
        }

        this.robots = RobotsParser(this.url.origin, robotsTxt);
        this.ready = true;
    }

    /**
     * Crawls a path on the site. If the site's <code>robots.txt</code> disallows this, it will return <code>false</code>.
     * @param path The path.
     * @example
     * // This example would crawl the crawler instance's URL on the path /test (e.g. https://example.com/test)
     * await Crawler.crawl('/test');
     * @returns {string[]} A list of new paths the crawler found.
     * @throws Errors if the crawler has not been readyed up yet with {@link Crawler#readyUp}.
     * @throws Errors if the path does not exist.
     */
    public async crawl(path: string): Promise<string[] | boolean> {
        if (!this.ready) {
            throw new Error('Attempting to crawl with unready crawler');
        }

        const url = new URL(path, this.url.origin).href;

        if (this.robots.isDisallowed(url)) {
            return false;
        }

        const page = await Fetch(url, { headers: { 'User-Agent': 'Spiderboi/' + version } }).then(res => res.text());
        const $ = cheerio.load(page);

        const anchors = $('a');

        const paths: string[] = [];

        anchors.each((_, anchor) => {
            const newUrl = new URL($(anchor).attr('href'), this.url.origin);

            if (newUrl.host !== this.url.host) {
                return;
            }

            paths.push(newUrl.href);
        });

        return paths;
    }
}

export default Crawler;
