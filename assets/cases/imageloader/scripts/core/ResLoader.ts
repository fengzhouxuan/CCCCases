
const { ccclass, property } = cc._decorator;

export class ResLoaderOption {
    ext: string = 'default';
    constructor(option?: Partial<ResLoader>) {
        Object.assign(this, option);
    }
}

@ccclass
export class ResLoader {

    public static load<T extends cc.Asset>(url: string, type: { prototype: T }): Promise<T>;
    public static load<T extends cc.Asset>(url: string, option: ResLoaderOption): Promise<T>;
    public static load<T extends cc.Asset>(url: string, option?: ResLoaderOption, type?: { prototype: T }): Promise<T>;
    public static load<T extends cc.Asset>(url: string, option?: ResLoaderOption | { prototype: T }, type?: { prototype: T }): Promise<T> {
        let isRemoteUrl = this.isRemoteUrl(url);
        if (isRemoteUrl) {
            return this.loadRemote(url, option as ResLoaderOption) as Promise<T>;
        } else {
            if (!type) {
                return this.loadAsset(url, new ResLoaderOption(), option as { prototype: T });
            }
            return this.loadAsset(url, option as ResLoaderOption, type);
        }
    }
    /**
     * 
     * @param url 'xxxx@bundleName'
     * @param option 
     * @param type 
     */
    public static loadAsset<T extends cc.Asset>(url, option: ResLoaderOption, type: { prototype: T }): Promise<T> {
        let [path, bundleName] = url.split('@');
        if (bundleName) {
            return new Promise((resolve, reject) => {
                cc.assetManager.loadBundle(bundleName, option, (err, bundle) => {
                    if (err) {
                        console.error(err);
                        reject(null);
                        return;
                    }
                    bundle.load(path, type, (err, asset) => {
                        if (err) {
                            console.error(err);
                            reject(null);
                            return;
                        }
                        resolve(asset);
                    });
                });
            })

        }
    }

    private static loadRemote(url: string, option: ResLoaderOption): Promise<cc.Asset> {
        return new Promise((resolve, reject) => {
            cc.assetManager.loadRemote(url, option, (err, asset) => {
                if (err) {
                    console.error(err);
                    reject(null);
                    return;
                }
                resolve(asset);
            });
        })
    }

    private static isRemoteUrl(url: string) {
        return url.startsWith('http') || url.startsWith('https') || url.startsWith('/');
    }
}
