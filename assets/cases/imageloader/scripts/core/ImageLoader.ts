import { ResLoader, ResLoaderOption } from "./ResLoader";

const { ccclass, property } = cc._decorator;
class ImageLoadInfo {
    url: string = '';
    sprite: cc.Sprite = null;

    constructor(url: string, sprite: cc.Sprite) {
        this.url = url;
        this.sprite = sprite;
    }

    public static create(url: string, sprite: cc.Sprite): ImageLoadInfo {
        return new ImageLoadInfo(url, sprite);
    }
}

class ImageInfo {
    url: string = '';
    spriteFrame: cc.SpriteFrame = null;
    source: ImagewSourceType = ImagewSourceType.Boundle;
    constructor(url: string, spriteFrame: cc.SpriteFrame, source: ImagewSourceType) {
        this.url = url;
        this.spriteFrame = spriteFrame;
        this.source = source;
    }
    public static create(url: string, spriteFrame: cc.SpriteFrame, source: ImagewSourceType): ImageInfo {
        return new ImageInfo(url, spriteFrame, source);
    }
}

class ImageDependenInfo {
    owner: object | cc.Component;
    imageInfo: ImageInfo;
    constructor(owner: object, imageInfo: ImageInfo) {
        this.owner = owner;
        this.imageInfo = imageInfo;
    }

    public isOwnerValid(): boolean {
        if (!this.owner) {
            return false;
        }
        if (this.owner instanceof cc.Component) {
            return this.owner.isValid;
        }
        return true;
    }
    public static create(owner: object, imageInfo: ImageInfo): ImageDependenInfo {
        return new ImageDependenInfo(owner, imageInfo);
    }
}

enum ImagewSourceType {
    Boundle,
    Remote
}

@ccclass
export default class ImageLoader {
    private static _instance: ImageLoader = null;
    public static get instance(): ImageLoader {
        if (!this._instance) {
            this._instance = new ImageLoader();
        }
        return this._instance;
    }

    private _loadingUrls: string[] = [];
    private _loadedSpriteFrames: Map<string, ImageInfo> = new Map();
    private _loadingInfos: Map<string, ImageLoadInfo[]> = new Map();
    private _imageDependencies: ImageDependenInfo[] = [];

    private constructor() {
        globalThis.imageloader = this;
        setInterval(() => {
            this.checkRelease();
        }, 10000);
    }
    public loadImage(url: string, sprite: cc.Sprite) {
        if (!url) {
            return;
        }
        if (!sprite) {
            return;
        }

        this.addLoadingInfo(url, sprite);

        if (this._loadedSpriteFrames.has(url)) {
            //已经加载过,直接返回
            let spf = this._loadedSpriteFrames.get(url);
            this.onloadImageComplete(url, spf);
            return;
        }
        if (this._loadingUrls.includes(url)) {
            //正在加载中
            return;
        }
        this._loadingUrls.push(url);
        ResLoader.load(url, new ResLoaderOption({ ext: '.png' }), cc.SpriteFrame).then((asset) => {
            this.onLoadAssetComplete(url, asset);
        })
    }

    private addLoadingInfo(url: string, sprite: cc.Sprite) {
        //检查加载队列里面是否已经有该sprite
        let loadingInfosThisSprite = this.getLoadingInfosBySprite(sprite);
        if (loadingInfosThisSprite) {
            //sprite已经在加载队列里面了,说明sprite正在加载的url和即将要加载的url是同一个
            for (let loadingInfo of loadingInfosThisSprite) {
                //置空，相当于取消之前的加载
                loadingInfo.sprite = null;
            }
        }
        //添加到加载队列
        if (!this._loadingInfos.has(url)) {
            this._loadingInfos.set(url, []);
        }
        let loadingInfo = ImageLoadInfo.create(url, sprite);
        this._loadingInfos.get(url).push(loadingInfo);
    }

    private getLoadingInfosBySprite(sprite: cc.Sprite): ImageLoadInfo[] {
        if (!sprite) {
            return null;
        }
        if (!this._loadingInfos) {
            return null;
        }
        if (this._loadingInfos.size === 0) {
            return null;
        }
        let outLoadingInfos: ImageLoadInfo[] = [];
        for (const [url, loadingInfos] of this._loadingInfos) {
            if (!loadingInfos) {
                continue;
            }
            loadingInfos.forEach(loadingInfo => {
                if (loadingInfo.sprite === sprite) {
                    outLoadingInfos.push(loadingInfo);
                }
            });

        }
        return outLoadingInfos;
    }

    private addDependenInfo(owner: object, imageInfo: ImageInfo) {
        imageInfo.spriteFrame.addRef();
        if (imageInfo.source === ImagewSourceType.Remote) {
            imageInfo.spriteFrame.getTexture().addRef();
        }
        let dependenInfo = ImageDependenInfo.create(owner, imageInfo);
        this._imageDependencies.push(dependenInfo);
    }

    private onloadImageComplete(url: string, imageInfo: ImageInfo) {
        //查询加载队列中是否有这个url
        let loadInfo = this._loadingInfos.get(url);
        if (loadInfo) {
            for (let info of loadInfo) {
                if (info.sprite) {
                    info.sprite.spriteFrame = imageInfo.spriteFrame;
                    //如果sprite已经被置空了,说明这次加载被取消了
                }
                //添加依赖信息，不管是不是取消了都要添加
                this.addDependenInfo(info.sprite, imageInfo);
            }
            this._loadingInfos.delete(url);
        }
    }

    private onLoadAssetComplete(url: string, asset: cc.Asset) {
        if (!asset) {
            return;
        }
        if (this._loadingUrls.indexOf(url) < 0) {
            return;
        }
        this._loadingUrls.splice(this._loadingUrls.indexOf(url), 1);
        let spf = null;
        let source = ImagewSourceType.Boundle;
        if (asset instanceof cc.Texture2D) {
            spf = new cc.SpriteFrame(asset);
            source = ImagewSourceType.Remote;
        } else {
            spf = asset as cc.SpriteFrame;
        }

        let imageInfo = ImageInfo.create(url, spf, source);

        this.onloadImageComplete(url, imageInfo);
    }

    private checkRelease() {
        if (this._imageDependencies.length === 0) {
            return;
        }
        for (let i = this._imageDependencies.length - 1; i >= 0; i--) {
            let dependenInfo = this._imageDependencies[i];
            let imageInfo = dependenInfo.imageInfo;
            if (!dependenInfo.isOwnerValid()) {
                //owner已经被销毁了,释放资源
                console.log('owner已经被销毁了,释放资源');
                imageInfo.spriteFrame.decRef();
                if (imageInfo.source === ImagewSourceType.Remote) {
                    if (imageInfo.spriteFrame.refCount === 0) {
                        //引用计数为0,说明这个资源已经没有被任何地方引用了,可以释放了
                        let tex = imageInfo.spriteFrame.getTexture();
                        if (tex) {
                            tex.decRef();
                        }
                    }
                }
                this._imageDependencies.splice(i, 1);
            }
        }
    }
}
