import Crawler from '..';

describe('robots.txt', () => {
    it('should not error when provided an invalid robots.txt', () => {
        expect(new Crawler('https://example.org').readyUp()).resolves.toBeUndefined();
    });
    
    it('should not error when provided a valid robots.txt', () => {
        expect(new Crawler('http://www.robotstxt.org').readyUp()).resolves.toBeUndefined();
    });
});

describe('crawling', () => {
    let crawler: Crawler;

    const newCrawler = async (url: string) => {
        crawler = new Crawler(url);
        await crawler.readyUp();
    }

    crawler = new Crawler('https://example.org');

    it('should error when trying to crawl when not ready', async () => await expect(crawler.crawl('/')).rejects.toThrow());

    // crawler ignores offsite links
    it('should return an empty array when crawling example.org', async () => {
        await crawler.readyUp();
        await expect(crawler.crawl('/')).resolves.toEqual([]);
    });

    it('should refuse to crawl google.com/search', async () => {
        await newCrawler('https://google.com');
        await expect(crawler.crawl('/search')).resolves.toBe(false);
    });
});