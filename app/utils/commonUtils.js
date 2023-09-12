function removeTrailingSlash(url) {
    // Use a regular expression to match and remove trailing '/' characters
    return url.replace(/\/+$/, '');
}

module.exports = removeTrailingSlash;
