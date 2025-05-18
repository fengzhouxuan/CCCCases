export class URLUtil {
    public static isRemoteUrl(url: string): boolean {
        if (!url) {
            return false;
        }
        return url.startsWith('http') || url.startsWith('https') || url.startsWith('/');
    }
}