// Turns a school name into a URL-safe identifier. Useful now for a stable,
// human-readable school reference, and later if the platform grows into
// subdomain-per-school routing.
export function slugify(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}
