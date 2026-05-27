import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement Blob.text() / File.text() in older builds.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
    Blob.prototype.text = function () {
        return new Response(this).text();
    };
}
