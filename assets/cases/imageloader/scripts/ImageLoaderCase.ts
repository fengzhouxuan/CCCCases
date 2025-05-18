import ImageLoader from "./core/ImageLoader";
import { ResLoader } from "./core/ResLoader";


const { ccclass, property } = cc._decorator;

const spfUrl1 = 'tex/mrx1111111111111@bundleImageloader';
const spfUrl2 = 'tex/wallhaven-yxz7jd@bundleImageloader';

const prefabUrl1 = 'prefab/prefabSprite@bundleImageloader';

const remoteUrl = 'https://raw.githubusercontent.com/fengzhouxuan/fengzhouxuan.github.io/refs/heads/main/img_mrx.png';
const remoteUrl2 = 'https://raw.githubusercontent.com/fengzhouxuan/fengzhouxuan.github.io/refs/heads/main/img/404-bg.jpg';
@ccclass
export default class ImageLoaderCase extends cc.Component {

    @property(cc.Sprite)
    sprite: cc.Sprite = null;
    @property(cc.Sprite)
    remoteSprite: cc.Sprite = null;
    @property(cc.Node)
    pfbParent: cc.Node = null;

    private _dySpf: cc.SpriteFrame = null;
    private _dyPfb: cc.Prefab = null;
    private _remoteSpf: cc.SpriteFrame = null;
    protected start(): void {
        ImageLoader.instance.loadImage(spfUrl1, this.sprite);
        ImageLoader.instance.loadImage(remoteUrl2, this.sprite);
        // ImageLoader.instance.loadImage(spfUrl2, this.sprite);
    }

    private loadSpf(url) {
        ResLoader.load(url, cc.SpriteFrame).then((asset) => {
            this.sprite.spriteFrame = asset;
            this._dySpf = asset;
            //加载完成后，引用计数+1
            this._dySpf.addRef();
        });
    }

    private loadPrefab(url) {
        ResLoader.load(url, cc.Prefab).then((asset) => {
            let node = cc.instantiate(asset);
            this.pfbParent.addChild(node);
            this._dyPfb = asset;
            //加载完成后，引用计数+1
            this._dyPfb.addRef();
            // let deps = cc.assetManager.dependUtil.getDeps(asset['_uuid']);
        })
    }

    private loadRemoteSpf(url) {
        ResLoader.load(url, { ext: '.png' }, cc.Texture2D).then((asset) => {
            this._remoteSpf = new cc.SpriteFrame(asset);
            this.remoteSprite.spriteFrame = this._remoteSpf;
            //加载完成后，引用计数+1
            this._remoteSpf.addRef();
            // texture引用计数+1
            asset.addRef();
        });
    }

    private onClickBtnLoadSpf() {
        this.loadSpf(spfUrl1);
    }

    private onClickBtnLoadRemoteSpf() {
        this.loadRemoteSpf(remoteUrl);
    }

    private onClickBtnUnloadSpf() {
        if (this._dySpf) {
            //卸载时，引用计数-1
            //当引用计数为0时，会自动释放资源
            this._dySpf.decRef();
            this._dySpf = null;
        }
    }

    private onClickBtnLoadPrefab() {
        this.loadPrefab(prefabUrl1);

    }
    private onClickBtnUnloadPrefab() {
        if (this._dyPfb) {
            this._dyPfb.decRef();
            this._dyPfb = null;
        }
    }

    protected onClickBtnUnloadRemote(): void {
        if (this._remoteSpf) {
            //先spriteFrame  -1
            this._remoteSpf.decRef();
            //判断先spriteFrame  -1 后，引用计数是否为0
            if (this._remoteSpf.refCount <= 0) {
                //如果为0，说明spriteFrame已经没有引用了，这时就需要给texture -1
                let tex = this._remoteSpf.getTexture();
                if (tex) {
                    tex.decRef();
                }
            }
            this._remoteSpf = null;
        }
    }
}
