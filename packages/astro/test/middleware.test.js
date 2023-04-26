import { loadFixture } from './test-utils.js';
import { expect } from 'chai';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';

describe('Middleware API', () => {
	describe('in DEV mode', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/middleware/',
			});
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('should render locals data', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);
			expect($('p').html()).to.equal('bar');
		});

		it('should change locals data based on URL', async () => {
			let html = await fixture.fetch('/').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('bar');

			html = await fixture.fetch('/lorem').then((res) => res.text());
			$ = cheerio.load(html);
			expect($('p').html()).to.equal('ipsum');
		});

		it('should call a second middleware', async () => {
			let html = await fixture.fetch('/second').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('second');
		});

		it('should successfully redirect to another page', async () => {
			let html = await fixture.fetch('/redirect').then((res) => {
				expect(res.status).to.equal(200);
				return res.text();
			});
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('bar');
			expect($('span').html()).to.equal('Index');
		});

		it('should successfully create a new response', async () => {
			let html = await fixture.fetch('/rewrite').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.be.null;
			expect($('span').html()).to.equal('New content!!');
		});

		it('should return a new response that is a 500', async () => {
			await fixture.fetch('/broken').then((res) => {
				expect(res.status).to.equal(500);
				return res.text();
			});
		});

		it('should successfully render a page if the middleware calls only next() and returns nothing', async () => {
			let html = await fixture.fetch('/not-interested').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('Not interested');
		});

		it('should throw an error when locals are not serializable', async () => {
			let html = await fixture.fetch('/broken-locals').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('title').html()).to.equal('LocalsNotSerializable');
		});

		it("should throw an error when the middleware doesn't call next or doesn't return a response", async () => {
			let html = await fixture.fetch('/does-nothing').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('title').html()).to.equal('MiddlewareNoDataReturned');
		});
	});

	describe('in PROD mode', () => {
		/** @type {import('./test-utils').Fixture} */
		let fixture;
		let previewServer;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/middleware/',
			});
			await fixture.build();
			previewServer = await fixture.preview();
		});

		// important: close preview server (free up port and connection)
		after(async () => {
			await previewServer.stop();
		});

		it('should render locals data', async () => {
			const html = await fixture.fetch('/').then((res) => res.text());
			const $ = cheerio.load(html);
			expect($('p').html()).to.equal('bar');
		});

		it('should change locals data based on URL', async () => {
			let html = await fixture.fetch('/').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('bar');

			html = await fixture.fetch('/lorem').then((res) => res.text());
			$ = cheerio.load(html);
			expect($('p').html()).to.equal('ipsum');
		});

		it('should call a second middleware', async () => {
			let html = await fixture.fetch('/second').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('second');
		});

		it('should successfully redirect to another page', async () => {
			let html = await fixture.fetch('/redirect').then((res) => {
				expect(res.status).to.equal(200);
				return res.text();
			});
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('bar');
			expect($('span').html()).to.equal('Index');
		});

		it('should successfully create a new response', async () => {
			let html = await fixture.fetch('/rewrite').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.be.null;
			expect($('span').html()).to.equal('New content!!');
		});

		it('should return a new response that is a 500', async () => {
			await fixture.fetch('/broken').then((res) => {
				expect(res.status).to.equal(500);
				return res.text();
			});
		});

		it('should successfully render a page if the middleware calls only next() and returns nothing', async () => {
			let html = await fixture.fetch('/not-interested').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('p').html()).to.equal('Not interested');
		});

		it('should NOT throw an error when locals are not serializable', async () => {
			let html = await fixture.fetch('/broken-locals').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('title').html()).to.not.equal('LocalsNotSerializable');
		});

		it("should throws an error when the middleware doesn't call next or doesn't return a response", async () => {
			let html = await fixture.fetch('/does-nothing').then((res) => res.text());
			let $ = cheerio.load(html);
			expect($('title').html()).to.not.equal('MiddlewareNoDataReturned');
		});
	});
});